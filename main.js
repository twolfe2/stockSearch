'use strict';
// var charts = [];
// var length = 0;
$(document).ready(init);


function init() {


  var searchURL = 'https://search.xignite.com/Search/Suggest?parameter=XigniteFinancials.GetCompanyBalanceSheet.Identifier';
  $('#stockNames').select2({
    placeholder: "Type in the compaines you would like to compare",
    theme: 'bootstrap',
    tags: true,
    multiple: true,
    tokenSeperators: [',', ' '],
    minimumInputLength: 1,
    ajax: {
      url: searchURL,
      dataType: "json",
      data: function(params) {

        return {
          term: params.term
        }

      },
      processResults: function(data) {
        return {
          results: $.map(data.Results, function(item) {
            // debugger;
            return {
              text: item.Text,
              id: item.Value
            }
          })
        };
      }
    },

    cache: true




  });


  // $('#symbol').on('keydown', function(e) {
  //     if (e.keyCode === 9) {

  //         e.preventDefault();
  //         $('#symbol').val($('.selected').data("xigniteTypeaheadValue"));
  //         // debugger;
  //         $('#symbolSearch').focus();

  //     } else if (e.keyCode == 13) {
  //         $('#symbol').val($('.selected').data("xigniteTypeaheadValue"));
  //         $('#symbolSearch').click();
  //     }
  // });


  // $('.xignite-typeahead').xigniteTypeahead({ api: 'http://search.xignite.com/Search/Suggest', keyParam: 'parameter', q: 'term' });

  $('#symbolSearch').on('click', symbolSearch);

}







function symbolSearch() {
  var symbols = $('#stockNames').val();

  //make sure all symbols are upper case
  symbols = symbols.map(function(sym) {
    return sym.toUpperCase();
  });

  // console.log(symbol);
  var quoteURL = 'http://dev.markitondemand.com/Api/v2/Quote/jsonp';
  

  // $('#charts').hide();

  getOverview(quoteURL, symbols);

  //change this back
  // setTimeout(function () {getChart(chartURL, symbols)},5000);


}


function getOverview(quoteURL, symbols) {
  $('.stockInfo').empty();
  var output = [];
  var length = symbols.length;
  symbols.forEach((symbol) => {
    // setTimeout(function() {
    $.ajax(quoteURL, {

        beforeSend: function() {
          $('#symbolSearch').html('<i class="fa fa-refresh fa-spin fa-fw"></i><span class="sr-only">Loading...</span>');
          $('#symbolSearch').attr('disabled', true);
        },
        data: {
          symbol: symbol
        },
        async: false,
        dataType: 'jsonp',
        //so we don't reach api limit
        // timeout: 1500,

        success: function(data) {
          if (Object.keys(data).length === 1) {
            console.log(data);
            alert('Error. Please make sure you entered valid symbols.');
            $('#symbolSearch').text('Search');
            $('#stockNames').empty();
            $('#symbolSearch').attr('disabled', false);
            return;
          }
          var chartURL = 'http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp';
          getChart(chartURL, symbols);
          var $tr = $('.template').clone();
          $tr.removeClass('template');


          // debugger;

          $tr.find('.name').text(data.Name);
          $tr.find('.price').text(data.LastPrice);

          var change = data.Change.toFixed(3);
          $tr.find('.change').text(change);

          var changePercent = data.ChangePercent.toFixed(3);
          $tr.find('.changePercent').text(changePercent);

          var YTD = data.ChangePercentYTD.toFixed(3);
          $tr.find('.YTD').text(YTD);

          var momentDate = moment.fromOADate(data.MSDate).format('llll');
          $tr.find('.lastTrade').text(momentDate);

          $tr.find('.change').removeClass('btn-success btn-danger');
          $tr.find('.changePercent').removeClass('btn-success btn-danger');
          $tr.find('.YTD').removeClass('btn-success btn-danger');


          change > 0 ? $tr.find('.change').addClass('btn-success') : $tr.find('.change').addClass('btn-danger');
          changePercent > 0 ? $tr.find('.changePercent').addClass('btn-success') : $tr.find('.changePercent').addClass('btn-danger');
          YTD > 0 ? $tr.find('.YTD').addClass('btn-success') : $tr.find('.YTD').addClass('btn-danger');
          // debugger;
          length--;
          // console.log('in ajax callback');

          output.push($tr);

          // must delay this until all ajax calls are complete
          if (length === 0) {
            $('.stockInfo').empty().append(output);
            $('.mainTable').show();
          }


        },



        error: function(error) {
            // console.log('in error');
          if (error.status == 404) {
            $('#charts').empty().append('<div class="alert alert-danger" role="alert">API Rate limit reached. Please wait a minute and then try again.</div>');
            console.log('API rate limit reached. Please wait and try again');

          }
          // console.log(error.status);
          $('#symbolSearch').text('Search');
          $('#symbolSearch').attr('disabled', false);
        }
      })
      // },1000)






  })
}



//modified version of https://github.com/markitondemand/DataApis/blob/master/MarkitTimeseriesServiceSample.js
function getChart(chartURL, symbols) {
  
  var length = symbols.length;
  var charts = [];
  // console.log(length);
  var numDays = 1000;
  $('#charts').empty();

  symbols.forEach(symbol => {
    // setTimeout(function(){
    // debugger;
    var params = { parameters: JSON.stringify(getInputParams(symbol, numDays)) };
    $.ajax({
      beforeSend: function() {
        $('#chartContainer').html('');
      },
      data: params,
      url: chartURL,
      async: false,
      dataType: "jsonp",
      timeout: 5000,
      success: function(data) {
        // debugger;
        if (!data || data.Message) {
          console.log("Error:", data.Message)
          return;
        }

        charts.push(renderChart(data, symbol));
        // debugger;
        // console.log(length);
        length--;
        if (length === 0) {
          $('#symbolSearch').text('Search');
          $('#symbolSearch').attr('disabled', false);
          $('#charts').empty().append(charts);
          window.dispatchEvent(new Event('resize'));
          // $('#charts').show();
          // $(window).trigger('resize');
          // var width = $('.candleGraphs').css("width");
          // $('.highcharts-container').css("width", width);

        }

      },
      error: function(error) {
        // debugger;
        if (error.status == 404) {
          $('#charts').append('<div class="alert alert-danger" role="alert">API Rate limit reached. Please wait a minute and then try again.</div>');
          console.log('API rate limit reached. Please wait and try again');
        }
        console.log(error.status);
        $('#symbolSearch').text('Search');
        $('#symbolSearch').attr('disabled', false);
        $('#stockNames').empty();$('#stockNames').empty();

      }
    })


    // },1000);
  });



}


function renderChart(data, symbol) {
  // console.log(data);
  var ohlc = getOHLC(data);
  var volume = getVolume(data);

  var groupingUnits = [
    [
      'week', // unit name
      [1] // allowed multiples
    ],
    [
      'month', [1, 2, 3, 4, 6]
    ]
  ];
  var $chart = $('<div class="col-md-6 col-lg-6 col-xs-6 candleGraphs">');
  var count = 0;

  if (count % 2 === 0) {
    $chart.append('<div class="row">');

  }

  // create the chart
  $chart.highcharts('StockChart', {

    rangeSelector: {
      selected: 1
        //enabled: false
    },

    title: {
      text: symbol + ' Historical Price'
    },

    yAxis: [{
      title: {
        text: 'OHLC'
      },
      height: 200,
      lineWidth: 2
    }, {
      title: {
        text: 'Volume'
      },
      top: 300,
      height: 100,
      offset: 0,
      lineWidth: 2
    }],

    series: [{
      type: 'candlestick',
      name: symbol,
      data: ohlc,
      dataGrouping: {
        units: groupingUnits
      }
    }, {
      type: 'column',
      name: 'Volume',
      data: volume,
      yAxis: 1,
      dataGrouping: {
        units: groupingUnits
      }
    }],
    credits: {
      enabled: false
    }
  });
  // length--;
  // charts.push($chart);
  // if(length === 0) { 

  // $('#charts').append(charts);
  // }
  return $chart;

}

function getInputParams(symbol, numDays) {
  return {
    Normalized: false,
    NumberOfDays: numDays,
    DataPeriod: "Day",
    Elements: [{
      Symbol: symbol,
      Type: "price",
      Params: ["ohlc"]
    }, {
      Symbol: symbol,
      Type: "volume"
    }]

  }

}




function fixDate(dateIn) {
  var dat = new Date(dateIn);
  return Date.UTC(dat.getFullYear(), dat.getMonth(), dat.getDate());
};

function getOHLC(json) {
  var dates = json.Dates || [];
  var elements = json.Elements || [];
  var chartSeries = [];

  if (elements[0]) {

    for (var i = 0, datLen = dates.length; i < datLen; i++) {
      var dat = fixDate(dates[i]);
      var pointData = [
        dat,
        elements[0].DataSeries['open'].values[i],
        elements[0].DataSeries['high'].values[i],
        elements[0].DataSeries['low'].values[i],
        elements[0].DataSeries['close'].values[i]
      ];
      chartSeries.push(pointData);
    };
  }
  return chartSeries;
};

function getVolume(json) {
  var dates = json.Dates || [];
  var elements = json.Elements || [];
  var chartSeries = [];

  if (elements[1]) {

    for (var i = 0, datLen = dates.length; i < datLen; i++) {
      var dat = fixDate(dates[i]);
      var pointData = [
        dat,
        elements[1].DataSeries['volume'].values[i]
      ];
      chartSeries.push(pointData);
    };
  }
  return chartSeries;
};

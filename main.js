'use strict';

$(document).ready(init);


function init() {

    $('#symbol').on('keydown', function(e) {
        if (e.keyCode === 9) {

            e.preventDefault();
            $('#symbol').val($('.selected').data("xigniteTypeaheadValue"));
            // debugger;
             $('#symbolSearch').focus();

        } else if(e.keyCode == 13) {
          $('#symbol').val($('.selected').data("xigniteTypeaheadValue"));
          $('#symbolSearch').click();
        }
    });


    $('.xignite-typeahead').xigniteTypeahead({ api: 'http://search.xignite.com/Search/Suggest', keyParam: 'parameter', q: 'term' });

    $('#symbolSearch').on('click', symbolSearch);

}







function symbolSearch() {
    var symbol = $('#symbol').val().toUpperCase();
    // console.log(symbol);
    var quoteURL = 'http://dev.markitondemand.com/Api/v2/Quote/jsonp';
    var chartURL = 'http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp';

    getOverview(quoteURL, symbol);
    getChart(chartURL, symbol);


}


function getOverview(quoteURL, symbol) {
    $.ajax(quoteURL, {
        beforeSend: function() {
            $('#symbolSearch').html('<i class="fa fa-refresh fa-spin fa-fw"></i><span class="sr-only">Loading...</span>');
            $('#symbolSearch').attr('disabled', true);
        },
        data: {
            symbol: symbol
        },
        dataType: 'jsonp',

        success: function(data) {
            // debugger;
            if (Object.keys(data).length === 1) {
                alert('Error. Please make sure you entered a valid symbol.');
            } else {
                $('.name').text(data.Name);
                $('.price').text(data.LastPrice);

                var change = data.Change.toFixed(3);
                $('.change').text(change);

                var changePercent = data.ChangePercent.toFixed(3);
                $('.changePercent').text(changePercent);

                var YTD = data.ChangePercentYTD.toFixed(3);
                $('.YTD').text(YTD);

                var momentDate = moment.fromOADate(data.MSDate).format('llll');
                $('.lastTrade').text(momentDate);


                change > 0 ? $('.change').addClass('btn-success') : $('.change').addClass('btn-danger');
                changePercent > 0 ? $('.changePercent').addClass('btn-success') : $('.changePercent').addClass('btn-danger');
                YTD > 0 ? $('.YTD').addClass('btn-success') : $('.YTD').addClass('btn-danger');

                $('.mainTable').show();

            }

        },

        error: function(error) {
            alert('There was an error processing your request. Please try again.');
            $('#symbolSearch').text('Search');
            $('#symbolSearch').attr('disabled', false);
        }
    });
}



//modified version of https://github.com/markitondemand/DataApis/blob/master/MarkitTimeseriesServiceSample.js
function getChart(chartURL, symbol) {
    var numDays = 10000;
    var symbol = symbol;
    var params = { parameters: JSON.stringify(getInputParams(symbol, numDays)) };
    $.ajax({
        beforeSend: function() {
            $('#chartContainer').html('');
        },
        data: params,
        url: chartURL,
        dataType: "jsonp",
        success: function(data) {
            // debugger;
            if (!data || data.Message) {
                console.log("Error:", data.Message)
                return;
            }
            renderChart(data, symbol);
            $('#symbolSearch').text('Search');
            $('#symbolSearch').attr('disabled', false);

        },
        error: function(error) {
          // debugger;
            console.log(error.status);
            $('#symbolSearch').text('Search');
            $('#symbolSearch').attr('disabled', false);
        }
    })



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

    // create the chart
    $('#chartContainer').highcharts('StockChart', {

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

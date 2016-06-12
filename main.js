'use strict';

$(document).ready(init);


function init() {

    $('#symbol').on('keydown',function(e) {
      if(e.keyCode === 9) {
        
        e.preventDefault();
        $('#symbol').val($('.selected').data("xigniteTypeaheadValue"));

      }
    });

    $('.xignite-typeahead').xigniteTypeahead({ api: 'http://search.xignite.com/Search/Suggest', keyParam: 'parameter', q: 'term' });
    $('#symbolSearch').on('click', symbolSearch);

}







function symbolSearch() {
    var symbol = $('#symbol').val();
    // console.log(symbol);
    var quoteUrl = 'http://dev.markitondemand.com/Api/v2/Quote/jsonp';
    var chartUrl = 'http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp';

    $.ajax(quoteUrl, {
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

                $('.stockInfo').show();
            }

        },

        error: function(error) {
            alert('There was an error processing your request. Please try again.')
        }
    });

}

var page = require('webpage').create(),
    system = require('system');

if (system.args.length === 1) {
    console.log('Usage: fetch.js <some URL>');
    phantom.exit();
}

address = system.args[1];

page.onResourceRequested = function (requestData, networkRequest) {
    console.log("Requested " + requestData.url + ", id=" + requestData.id)
}
page.onResourceReceived = function (response) {
    if (response.stage === 'end') console.log("Received " + response.id)
}

page.open(address, function (status) {
    if (status !== 'success') {
        console.log('FAIL to load the address');
        phantom.exit();
    } else {
        var chapters = page.evaluate(function() {
            var TEXT_NODE = 3;
            var hrefs = [];
            var chtp = /^\d+/;
            $('[class^="zebra_"] > a').each(function() {
                if (this.previousSibling &&
                    this.previousSibling.nodeType == TEXT_NODE &&
                    chtp.test(this.previousSibling.textContent)) {
                    hrefs.push($(this).attr('href'));
                }
            })
            return hrefs;
        });
        console.log(chapters);
        console.log(chapters instanceof Array);
        page.open(address+"/"+chapters[0], function (status) {
            if (status !== 'success') {
                console.log('Failed to retrieve chapter');
                phantom.exit();
            } else {
                setTimeout(function () {
                    var comments = page.evaluate(function () {
                        var count = 0
                        $('.comment').each(function() {
                            var num = parseInt($(this).text())
                            if (!isNaN(num)) count += num
                        })
                        return count
                    })
                    console.log("Total number of comments: " + comments)
                    console.log('Initiate comment loading')
                    page.evaluate(function () {
                        loadAllComments()
                    })
//                    phantom.exit();
                }, 3000)
            }
        })
    }
});

var page = require('webpage').create(),
    system = require('system'),
    t, address;

if (system.args.length === 1) {
    console.log('Usage: fetch.js <some URL>');
    phantom.exit();
}

address = system.args[1];
page.open(address, function (status) {
    if (status !== 'success') {
        console.log('FAIL to load the address');
    } else {
        var text = page.evaluate(function() {
            var hrefs = [];
            $('[class^="zebra_"] > a').each(function() {
                hrefs.push($(this).attr('href'));
            })
            return hrefs.length;
        });
        console.log(text);
    }
    phantom.exit();
});
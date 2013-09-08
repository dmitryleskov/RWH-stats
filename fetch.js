var webpage = require('webpage'),
    fs = require('fs'),
    system = require('system');

if (system.args.length === 1) {
    console.log('Usage: fetch.js <book home URL>');
    phantom.exit();
}

address = system.args[1];

fs.write('missing.lst', '', 'w')
fs.write('comments-meta.txt', '', 'w')
function onResourceError(resourceError) {
    console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
    console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
    fs.write('missing.lst', resourceError.url+'\n', 'a')
    //phantom.exit();
};

page = webpage.create();
page.onResourceError = onResourceError
page.open(address + '/read/', function (status) {
    if (status !== 'success') {
        console.log('FAIL to load the TOC');
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
        page.close();
        for (i in chapters) {
            retrieveComments(chapters[i])
        }
    }
});

function retrieveComments(chapter) {
    console.log('Retriveing Chapter ' + chapter)
    var countRE = new RegExp(address + '/comments/chapter/.+/count/')
    var scRE = new RegExp(address + '/comments/single/.+/')
    var page = webpage.create()
    var csrid = null  // Comment summary resource id
    var csurl = ''
    page.onResourceRequested = function (requestData, networkRequest) {
        console.log("Requested " + requestData.url + ", id=" + requestData.id)
        if (countRE.test(requestData.url)) {
            console.log('Comments summary requested: ' + requestData.url)
            csrid = requestData.id
            csurl = requestData.url
        }
        //http://book.realworldhaskell.org/comments/chapter/funcstypes/count/
    }
    
    page.onResourceError = onResourceError
    
    page.onResourceReceived = function (response) {
        if (response.stage === 'end') {
            console.log("Received " + response.id)
            if (response.id === csrid) {
                console.log('Comments summary received')
                // Let the browser engine complete the insertion of comments    
                setTimeout(function () {
                    var comments = page.evaluate(function () {
                        var count = 0
                        $('.comment').each(function() {
                            var num = parseInt($(this).text())
                            if (!isNaN(num)) count += num
                        })
                        return count
                    })
                    console.log("Total number of comments in " + chapter + ": " + comments)
                    console.log('Initiate comment loading')
                    page.onResourceRequested = isCommentRequested 
                    page.onResourceReceived = isCommentReceived
                    page.evaluate(function () {
                        loadAllComments()
                    })
    //                    phantom.exit();
                }, 0)
            }
        }
    }

    var cc = 0
    var cids = []
    var ct = null
    function isCommentRequested (requestData, networkRequest) {
        console.log("Requested " + requestData.url + ", id=" + requestData.id)
        if (scRE.test(requestData.url)) {
            cids.push(requestData.id)
            cc++;
        }
    }
    function isCommentReceived (response) {
        if (response.stage === 'end') {
            console.log("Received " + response.id)
            if (cids.indexOf(response.id) != -1) {
                cc--;
                if (!cc) {
                    if (ct) clearTimeout(ct)
                    ct = setTimeout(function () {
                        console.log('Extracting comments metadata')
                        var comments = page.evaluate( function () {
                            comments = []
                            $("div.comment").each(function () {
                                $this = $(this)
                                comments.push({
                                    id: $this.find('.comment_id').text(),
                                    name: $this.find('.comment_name').text(),
                                    date: $this.find('.comment_date').text()    
                                })
                            })
                            return comments
                        })
                        console.log('Extracted metadata from ' + comments.length + ' comments')
                        for (i in comments) {
                            fs.write('comments-meta.txt', JSON.stringify(comments), 'w')
                        }
                        page.close()
                    }, 1000)
                }
            }
        }
    }
    
    page.open(address+"/read/"+chapter, function (status) {
        if (status !== 'success') {
            console.log('Failed to retrieve chapter ' + chapter);
            phantom.exit();
        } else {
            console.log('Chapter ' + chapter + ' loaded')
        }
    })
}
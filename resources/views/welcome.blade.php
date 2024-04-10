<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Laravel PDF Signature</title>
	<link rel="stylesheet" type="text/css" href="{{ asset("assets/css/pdfannotate.css") }}">
    <link rel="stylesheet" type="text/css" href="{{ asset("assets/css/style.css") }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <style>
        .loading-spinner{
            width:30px;
            height:30px;
            border:2px solid ;
            border-radius:50%;
            border-top-color:#6f42c1;
            display:inline-block;
            animation:loadingspinner .7s linear infinite;
        }
        @keyframes loadingspinner{
            0%{
                transform:rotate(0deg)
            }
            100%{
                transform:rotate(360deg)
            }
        }
        #pageNumber,
        .toolbarButton.pageUp,
        .toolbarButton.pageDown,
        .toolbarButton.zoomOut,
        .toolbarButton.zoomIn {
            position: unset !important;
        }

        #title {
            color: #323744;
        }
        #loadingBar {
            margin-top: 0px !important;
            background-color: #323744 !important;
            border-bottom: #323744 !important;
        }
        #loadingBar .progress {
            background-color: #6f42c1 !important;
        }
        #viewerContainer {
            top: 5rem !important;
            bottom: 8rem !important;
        }
        #pageNumber {
            color: #323744 !important;
        }
        *,
        *::before,
        *::after {
            box-sizing: unset;
        }
        input[type=file] {
            display: none;
        }

        .document-toolbar {
            padding: 0px;
        }
        footer {
            background-image: unset !important;
            background-color: #323744;
        }
        body {
            padding-bottom: 0rem !important;
        }
    </style>

    <link rel="stylesheet" href="{{ asset("web/pdf_viewer.css") }}">
    <link rel="stylesheet" type="text/css" href="{{ asset("viewer.css") }}">

    <script src="{{ asset("build/pdf.js") }}"></script>
    <script src="{{ asset("web/pdf_viewer.js") }}"></script>
  </head>
  <body class="antialiased">
    <div class="wrapper">
        <div class="content" style="margin-left: 0px !important;">
            <div class="content-header" style="display: none">
                <h2 id="title"></h2>
            </div><!-- .content-header -->
            <div id="errorWrapper" hidden="true">
                <div id="errorMessageLeft">
                  <span id="errorMessage"></span>
                  <button id="errorShowMore">
                    More Information
                  </button>
                  <button id="errorShowLess">
                    Less Information
                  </button>
                </div>
                <div id="errorMessageRight">
                  <button id="errorClose">
                    Close
                  </button>
                </div>
                <div class="clearBoth"></div>
                <textarea id="errorMoreInfo" hidden="true" readonly="readonly"></textarea>
              </div>
            <div class="document-toolbar-container-sticky">
                <div class="document-toolbar" style="left: 0 !important; width: calc(100%) !important">
                    <div class="d-flex justify-content-between">
                        <div class="d-block text-primary" style="padding-top: 4px;"></div>
                        <div class="d-block text-primary" style="padding-top: 4px; padding-right: 10px;">
                            <p style="font-size: 13px; color: #323744; border-radius: 10px; font-weight: 400;" id="documentPercentageLoaded"></p>
                        </div>
                    </div>
                </div><!-- .document-toolbar -->
            </div><!-- .document-toolbar -->
            <div id="loadingBar">
                <div class="progress"></div>
                <div class="glimmer"></div>
            </div>
        </div><!-- .content -->

        <div id="viewerContainer">
            <div id="viewer" class="pdfViewer"></div>
        </div>
    </div><!-- .wrapper -->
    <footer style="padding: 10px 20px 10px;">
        <div class="d-flex justify-content-between">
            <div class="text-primary" style="padding-top: 4px;">
                <button id="delete-signature-btn" onclick="clearPage()" class="text-white btn btn-rounded btn-sm btn-uppercase btn-default px-4 py-1" disabled><i class="fa fa-trash fa-2x"></i></button>
                <input type="hidden" id="pageNumber" class="toolbarField pageNumber" value="1" size="4" min="1">

                <button onclick="addImage(event)" class="btn btn-rounded btn-sm btn-uppercase btn-primary px-4 py-1 mx-2"><i class="fa fa-pencil fa-2x"></i></button>
            </div><!-- .d-block -->
            <div class="d-block text-primary" style="padding-top: 4px;">
                <button onclick="validateSubmit()" class="btn btn-rounded btn-sm btn-uppercase btn-primary px-4 py-2">Download</button>
            </div>
        </div><!-- .justify-content-between -->
    </footer>


    <script src="{{ asset("assets/js/jquery.min.js") }}"></script>
    <script src="{{ asset("assets/js/popper.min.js") }}" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
    <script src="{{ asset("assets/js/bootstrap.min.js") }}"></script>
    <script type="text/javascript" src="https://unpkg.com/default-passive-events"></script>

    <script>
        var filePath = "{{ $filepath }}";
        var pdfWorkerJs = "{{ asset("build/pdf.worker.js") }}";

        function validateSubmit() {
            if ($("#documentPercentageLoaded").text() != "PDF loaded: 100%") {
                alert("Make sure PDF loaded 100%, before download");
            } else {
                savePDF();
            }
        }

        function wait_box(){
            $("body").append("<div id='waiting_box'><div class='loading-spinner mb-2'></div><div style='color: #323744'>Downloading...</div></div>");
            var cake = $(window).height();
            var neew = cake / 2.2;
            $('#waiting_box').attr('style','z-index:999;background-color: white;color: #323744;text-align:center;position:fixed;top:0;left:0;width:100%;height:100%;padding-top:'+neew+'px;');
            $('#waiting_box').removeAttr('hidden');
        }
    </script>
    <script src="{{ asset("assets/js/fabric.min.js") }}"></script>
    <script src="{{ asset("assets/js/jspdf.umd.min.js") }}"></script>
    <script src="{{ asset("assets/js/run_prettify.js") }}"></script>
    <script src="{{ asset("assets/js/prettify.min.js") }}"></script>
    <script src="{{ asset("assets/js/arrow.fabric.js") }}"></script>
    <script src="{{ asset("assets/js/pdfannotate.js") }}"></script>
    <script src="{{ asset("assets/js/script.js") }}"></script>
  </body>
</html>



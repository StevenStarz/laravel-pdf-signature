/**
 * PDFAnnotate v1.0.1
 * Author: Ravisha Heshan
 */
"use strict";

if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
    // eslint-disable-next-line no-alert
    alert("Please build the pdfjs-dist library using\n `gulp dist-install`");
}


var PDFAnnotate = function(container_id, url, options = {}) {
    this.number_of_pages = 0;
    this.pages_rendered = 0;
    this.active_tool = 0; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle
    this.fabricObjects = [];
    this.fabricObjectsData = [];
    this.color = '#212121';
    this.borderColor = '#000000';
    this.borderSize = 1;
    this.font_size = 16;
    this.active_canvas = 0;
    this.container_id = container_id;
    this.url = url;
    this.pageImageCompression = options.pageImageCompression ?
        options.pageImageCompression.toUpperCase() :
        "NONE";
    this.pdfAnnotateOptions = options;
    var inst = this;


    const USE_ONLY_CSS_ZOOM = true;
    const TEXT_LAYER_MODE = 0; // DISABLE
    // const MAX_IMAGE_SIZE = 2290 * 2289;
    const MAX_IMAGE_SIZE = -1;
    const CMAP_URL = "web/cmaps/";
    const CMAP_PACKED = true;

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerJs;

    // const DEFAULT_URL = "web/xKqMJpAELaSHMMAU1cU1H8p5IATt6UVthWPJlM6r.pdf";
    const DEFAULT_URL = filePath;
    const DEFAULT_SCALE_DELTA = 1.1;
    const MIN_SCALE = 0.25;
    const MAX_SCALE = 10.0;
    const DEFAULT_SCALE_VALUE = "auto";

    const PDFViewerApplication = {
        pdfLoadingTask: null,
        pdfDocument: null,
        pdfViewer: null,
        pdfHistory: null,
        pdfLinkService: null,
        eventBus: null,

        /**
         * Opens PDF document specified by URL.
         * @returns {Promise} - Returns the promise, which is resolved when document
         *                      is opened.
         */
        open(params) {
            if (this.pdfLoadingTask) {
                // We need to destroy already opened document
                return this.close().then(
                    function() {
                        // ... and repeat the open() call.
                        return this.open(params);
                    }.bind(this)
                );
            }

            const url = params.url;
            const self = this;
            this.setTitleUsingUrl(url);

            // Loading document.
            const loadingTask = pdfjsLib.getDocument({
                url,
                maxImageSize: MAX_IMAGE_SIZE,
                cMapUrl: CMAP_URL,
                cMapPacked: CMAP_PACKED,
                disableAutoFetch: params.disableAutoFetch,
                disableRange: params.disableRange,
                disableStream: params.disableStream
            });
            this.pdfLoadingTask = loadingTask;

            loadingTask.onProgress = function(progressData) {
                self.progress(progressData.loaded / progressData.total);
            };

            return loadingTask.promise.then(
                function(pdfDocument) {
                    // Document loaded, specifying document for the viewer.
                    self.pdfDocument = pdfDocument;
                    self.pdfViewer.setDocument(pdfDocument);
                    self.pdfLinkService.setDocument(pdfDocument);
                    // self.pdfHistory.initialize({
                    //     fingerprint: pdfDocument.fingerprint
                    // });

                    self.loadingBar.hide();
                    self.setTitleUsingMetadata(pdfDocument);
                    inst.number_of_pages = pdfDocument.numPages;
                },
                function(exception) {
                    const message = exception && exception.message;
                    const l10n = self.l10n;
                    let loadingErrorMessage;

                    if (exception instanceof pdfjsLib.InvalidPDFException) {
                        // change error message also for other builds
                        loadingErrorMessage = l10n.get(
                            "invalid_file_error",
                            null,
                            "Invalid or corrupted PDF file."
                        );
                    } else if (exception instanceof pdfjsLib.MissingPDFException) {
                        // special message for missing PDFs
                        loadingErrorMessage = l10n.get(
                            "missing_file_error",
                            null,
                            "Missing PDF file."
                        );
                    } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
                        loadingErrorMessage = l10n.get(
                            "unexpected_response_error",
                            null,
                            "Unexpected server response."
                        );
                    } else {
                        loadingErrorMessage = l10n.get(
                            "loading_error",
                            null,
                            "An error occurred while loading the PDF."
                        );
                    }

                    loadingErrorMessage.then(function(msg) {
                        self.error(msg, {
                            message
                        });
                    });
                    self.loadingBar.hide();
                }
            );
        },


        /**
         * Closes opened PDF document.
         * @returns {Promise} - Returns the promise, which is resolved when all
         *                      destruction is completed.
         */
        close() {
            const errorWrapper = document.getElementById("errorWrapper");
            errorWrapper.hidden = true;

            if (!this.pdfLoadingTask) {
                return Promise.resolve();
            }

            const promise = this.pdfLoadingTask.destroy();
            this.pdfLoadingTask = null;

            if (this.pdfDocument) {
                this.pdfDocument = null;

                this.pdfViewer.setDocument(null);
                this.pdfLinkService.setDocument(null, null);

                if (this.pdfHistory) {
                    this.pdfHistory.reset();
                }
            }

            return promise;
        },

        get loadingBar() {
            const bar = new pdfjsViewer.ProgressBar("#loadingBar", {});

            return pdfjsLib.shadow(this, "loadingBar", bar);
        },

        setTitleUsingUrl: function pdfViewSetTitleUsingUrl(url) {
            this.url = url;
            let title = pdfjsLib.getFilenameFromUrl(url) || url;
            try {
                title = decodeURIComponent(title);
            } catch (e) {
                // decodeURIComponent may throw URIError,
                // fall back to using the unprocessed url in that case
            }
            this.setTitle(title);
        },

        setTitleUsingMetadata(pdfDocument) {
            const self = this;
            pdfDocument.getMetadata().then(function(data) {
                const info = data.info,
                    metadata = data.metadata;
                self.documentInfo = info;
                self.metadata = metadata;

                // Provides some basic debug information
                console.log(
                    "PDF " +
                    pdfDocument.fingerprint +
                    " [" +
                    info.PDFFormatVersion +
                    " " +
                    (info.Producer || "-").trim() +
                    " / " +
                    (info.Creator || "-").trim() +
                    "]" +
                    " (PDF.js: " +
                    (pdfjsLib.version || "-") +
                    ")"
                );

                let pdfTitle;
                if (metadata && metadata.has("dc:title")) {
                    const title = metadata.get("dc:title");
                    // Ghostscript sometimes returns 'Untitled', so prevent setting the
                    // title to 'Untitled.
                    if (title !== "Untitled") {
                        pdfTitle = title;
                    }
                }

                if (!pdfTitle && info && info.Title) {
                    pdfTitle = info.Title;
                }

                if (pdfTitle) {
                    self.setTitle(pdfTitle + " - " + document.title);
                }
            });
        },

        setTitle: function pdfViewSetTitle(title) {
            document.title = title;
            document.getElementById("title").textContent = title;
        },

        error: function pdfViewError(message, moreInfo) {
            const l10n = this.l10n;
            const moreInfoText = [
                l10n.get(
                    "error_version_info", {
                        version: pdfjsLib.version || "?",
                        build: pdfjsLib.build || "?"
                    },
                    "PDF.js v{{version}} (build: {{build}})"
                ),
            ];

            if (moreInfo) {
                moreInfoText.push(
                    l10n.get(
                        "error_message", {
                            message: moreInfo.message
                        },
                        "Message: {{message}}"
                    )
                );
                if (moreInfo.stack) {
                    moreInfoText.push(
                        l10n.get("error_stack", {
                            stack: moreInfo.stack
                        }, "Stack: {{stack}}")
                    );
                } else {
                    if (moreInfo.filename) {
                        moreInfoText.push(
                            l10n.get(
                                "error_file", {
                                    file: moreInfo.filename
                                },
                                "File: {{file}}"
                            )
                        );
                    }
                    if (moreInfo.lineNumber) {
                        moreInfoText.push(
                            l10n.get(
                                "error_line", {
                                    line: moreInfo.lineNumber
                                },
                                "Line: {{line}}"
                            )
                        );
                    }
                }
            }

            const errorWrapper = document.getElementById("errorWrapper");
            errorWrapper.hidden = false;

            const errorMessage = document.getElementById("errorMessage");
            errorMessage.textContent = message;

            const closeButton = document.getElementById("errorClose");
            closeButton.onclick = function() {
                errorWrapper.hidden = true;
            };

            const errorMoreInfo = document.getElementById("errorMoreInfo");
            const moreInfoButton = document.getElementById("errorShowMore");
            const lessInfoButton = document.getElementById("errorShowLess");
            moreInfoButton.onclick = function() {
                errorMoreInfo.hidden = false;
                moreInfoButton.hidden = true;
                lessInfoButton.hidden = false;
                errorMoreInfo.style.height = errorMoreInfo.scrollHeight + "px";
            };
            lessInfoButton.onclick = function() {
                errorMoreInfo.hidden = true;
                moreInfoButton.hidden = false;
                lessInfoButton.hidden = true;
            };
            moreInfoButton.hidden = false;
            lessInfoButton.hidden = true;
            Promise.all(moreInfoText).then(function(parts) {
                errorMoreInfo.value = parts.join("\n");
            });
        },

        progress: function pdfViewProgress(level) {
            const percent = Math.round(level * 100);
            // Updating the bar if value increases.
            if (percent > this.loadingBar.percent || isNaN(percent)) {
                this.loadingBar.percent = percent;
            }
        },

        get pagesCount() {
            return this.pdfDocument.numPages;
        },

        get page() {
            return this.pdfViewer.currentPageNumber;
        },

        set page(val) {
            this.pdfViewer.currentPageNumber = val;
        },

        zoomIn: function pdfViewZoomIn(ticks) {
            let newScale = this.pdfViewer.currentScale;
            do {
                newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.ceil(newScale * 10) / 10;
                newScale = Math.min(MAX_SCALE, newScale);
            } while (--ticks && newScale < MAX_SCALE);
            this.pdfViewer.currentScaleValue = newScale;
        },

        zoomOut: function pdfViewZoomOut(ticks) {
            let newScale = this.pdfViewer.currentScale;
            do {
                newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.floor(newScale * 10) / 10;
                newScale = Math.max(MIN_SCALE, newScale);
            } while (--ticks && newScale > MIN_SCALE);
            this.pdfViewer.currentScaleValue = newScale;
        },

        initUI: function pdfViewInitUI() {
            const eventBus = new pdfjsViewer.EventBus();
            this.eventBus = eventBus;

            const linkService = new pdfjsViewer.PDFLinkService({
                eventBus,
            });
            this.pdfLinkService = linkService;

            this.l10n = pdfjsViewer.NullL10n;

            const container = document.getElementById("viewerContainer");
            const pdfViewer = new pdfjsViewer.PDFViewer({
                container,
                eventBus,
                linkService,
                l10n: this.l10n,
                useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
                textLayerMode: TEXT_LAYER_MODE,
            });
            this.pdfViewer = pdfViewer;
            linkService.setViewer(pdfViewer);

            this.pdfHistory = new pdfjsViewer.PDFHistory({
                eventBus,
                linkService,
            });
            linkService.setHistory(this.pdfHistory);

            // document.getElementById("previous").addEventListener("click", function() {
            //     PDFViewerApplication.page--;
            // });

            // document.getElementById("next").addEventListener("click", function() {
            //     PDFViewerApplication.page++;
            // });

            // document.getElementById("zoomIn").addEventListener("click", function() {
            //     PDFViewerApplication.zoomIn();
            // });

            // document.getElementById("zoomOut").addEventListener("click", function() {
            //     PDFViewerApplication.zoomOut();
            // });

            document
                .getElementById("pageNumber")
                .addEventListener("click", function() {
                    this.select();
                });

            document
                .getElementById("pageNumber")
                .addEventListener("change", function() {
                    console.log(this.value);
                    PDFViewerApplication.page = this.value | 0;

                    // Ensure that the page number input displays the correct value,
                    // even if the value entered by the user was invalid
                    // (e.g. a floating point number).
                    if (this.value !== PDFViewerApplication.page.toString()) {
                        this.value = PDFViewerApplication.page;
                    }
                });

            eventBus.on("pagesinit", function() {
                // We can use pdfViewer now, e.g. let's change default scale.
                pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
            });

            eventBus.on(
                "pagechanging",
                function(evt) {
                    const page = evt.pageNumber;
                    const numPages = PDFViewerApplication.pagesCount;

                    document.getElementById("pageNumber").value = page;
                    // document.getElementById("previous").disabled = page <= 1;
                    // document.getElementById("next").disabled = page >= numPages;
                },
                true
            );
        },
    };

    window.PDFViewerApplication = PDFViewerApplication;

    document.addEventListener(
        "DOMContentLoaded",
        function() {
            PDFViewerApplication.initUI();
        },
        true
    );

    // The offsetParent is not set until the PDF.js iframe or object is visible;
    // waiting for first animation.
    const animationStarted = new Promise(function(resolve) {
        window.requestAnimationFrame(resolve);
    });

    // We need to delay opening until all HTML is loaded.
    animationStarted.then(function() {
        PDFViewerApplication.open({
            url: DEFAULT_URL,
            disableAutoFetch: true,
            disableRange: true,
            disableStream: true
        });
    });
}


PDFAnnotate.prototype.addImageToCanvas = function() {
    var inst = this;
    inst.active_canvas = PDFViewerApplication.page - 1;
    var fabricObj = inst.fabricObjects[PDFViewerApplication.page - 1];

    if (fabricObj) {
        var inputElement = document.createElement("input");
        inputElement.type = 'file'
        inputElement.accept = ".jpg,.jpeg,.png,.PNG,.JPG,.JPEG";
        inputElement.onchange = function() {
            var reader = new FileReader();
            reader.addEventListener("load", function() {
                inputElement.remove()
                var outputScale = window.devicePixelRatio || 1;

                var image = new Image();
                image.onload = function() {
                    fabricObj.add(
                        new fabric.Image(image, {
                            top: fabricObj.height / 2,
                            left: fabricObj.width / 2,
                            originX: 'center',
                            originY: 'center',
                            enableRetinaScaling: false,
                            withoutTransform: true
                        }).scaleToHeight(200)
                    )
                }
                image.src = this.result;
            }, false);
            reader.readAsDataURL(inputElement.files[0]);
        }
        document.getElementsByTagName('body')[0].appendChild(inputElement)
        inputElement.click()
    }
}

PDFAnnotate.prototype.deleteSelectedObject = function() {
    var inst = this;
    var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
    if (activeObject) {
        if (confirm('Are you sure ?')) inst.fabricObjects[inst.active_canvas].remove(activeObject);
    }
}

PDFAnnotate.prototype.savePdf = function(fileName) {
    wait_box();

    var inst = this;
    setTimeout(function () {
        var firstObject = inst.fabricObjects[0];

        var isFirstPortrait = firstObject.getHeight() > firstObject.getWidth();
        var doc;

        if (isFirstPortrait) {
            doc = new jspdf.jsPDF('p', 'pt');
        } else {
            doc = new jspdf.jsPDF('l', 'pt');
        }

        if (typeof fileName === 'undefined') {
            fileName = `${new Date().getTime()}.pdf`;
        }

        inst.fabricObjects.forEach(function(fabricObj, index) {
            var isPortrait = fabricObj.getHeight() > fabricObj.getWidth();
            if (index != 0) {
                if (isPortrait) {
                    doc.addPage("letter", "p");
                } else {
                    doc.addPage("letter", "l");
                }

                doc.setPage(index + 1);
            }

            doc.addImage(
                fabricObj.toDataURL({
                    format: 'png'
                }),
                "PNG",
                0,
                0,
                doc.internal.pageSize.getWidth(),
                doc.internal.pageSize.getHeight(),
                `page-${index + 1}`,
                ["FAST", "MEDIUM", "SLOW"].indexOf(inst.pageImageCompression) >= 0 ?
                inst.pageImageCompression :
                undefined
            );

            if (index === inst.fabricObjects.length - 1) {
                doc.save(fileName);
            }

        })

        $('#waiting_box').remove();

    }, 500);
}

PDFAnnotate.prototype.clearActivePage = function() {
    var inst = this;

    if (confirm('Are you sure?')) {
        inst.fabricObjects.forEach((obj) => {
            var bg = obj.backgroundImage;

            obj.getActiveObjects().forEach((obj1) => {
                obj.remove(obj1);
            })

            obj.setBackgroundImage(bg, obj.renderAll.bind(obj));
        })
    }

    $("#delete-signature-btn").prop("disabled", true);
    $("#delete-signature-btn").removeClass("btn-danger").addClass("btn-default");
}


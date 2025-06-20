        let signals = []; // Store signal data dynamically
        document.getElementById("initialize").addEventListener("click", function () {
            let numSignals = parseInt(document.getElementById("numFiles").value);
            initializeUI(numSignals);
        });
        
        function initializeUI(numSignals) {
            const fileInputsContainer = document.getElementById("fileInputsContainer");
            fileInputsContainer.innerHTML = ""; // Clear previous inputs
            signals = []; // Reset signals array
        
            let plotsHTML = '<div class="center-wrapper">';
            //let sampleSizeHTML = '<div class="sample-size">';
            // ✅ Create only ONE sample size display (for the first signal)
            let sampleSizeHTML = '<div class="sample-size"><pre id="sampleCount1"></pre></div>';

        
            for (let i = 0; i < numSignals; i++) {
                let index = i + 1;
                signals.push({ data: [], metadata: '', sampleCountId: `sampleCount${index}` });
        
                // Create file input & save button inside fileInputsContainer
                let fileInputHTML = `
                    <div class="file-input">
                        <label for="fileInput${index}">Signal-${index}:</label>
                        <input type="file" id="fileInput${index}">
                        <button id="saveButton${index}">Save</button>
                    </div>
                `;
                fileInputsContainer.innerHTML += fileInputHTML;
        
                // Create plot section
                plotsHTML += `
                    <div class="plot-section">
                        <div><strong>Signal-${index}</strong></div>
                        <div id="plotArea${index}" class="plot"></div>
                    </div>
                `;
        
                // Create sample count section
                //sampleSizeHTML += `<pre id="sampleCount${index}"></pre>`;
            }
        
            plotsHTML += `</div>`; // Close plots container
            //sampleSizeHTML += `</div>`; // Close sample size container
        
            document.getElementById("dynamicContainers").innerHTML = plotsHTML + sampleSizeHTML;
        
            attachFileHandlers(numSignals);
        } 
        
        function attachFileHandlers(numSignals) {
            for (let i = 0; i < numSignals; i++) {
                let index = i + 1;
                let fileInput = document.getElementById(`fileInput${index}`);
                let saveButton = document.getElementById(`saveButton${index}`);
        
                fileInput.addEventListener("change", function (event) {
                    const file = event.target.files[0];
                    const reader = new FileReader();
        
                    reader.onload = function (e) {
                        signals[i].data = [];
                        const lines = e.target.result.split("\n");
                        signals[i].metadata = lines.slice(0, 3).join("\n");
                        signals[i].data = lines.slice(3).map(Number).filter((num) => !isNaN(num));
        
                        plotData(signals[i].data, `plotArea${index}`);
                        //document.getElementById(signals[i].sampleCountId).innerText = `Sample size: ${signals[i].data.length}`;

                        if (i === 0) { // ✅ Only update the first signal's sample size
                            document.getElementById("sampleCount1").innerText = `Sample size: ${signals[i].data.length}`;
                        }                        
        
                        if (i === 0) initializeSlider(signals[i].data.length);
                    };
                    reader.readAsText(file);
                });
        
                saveButton.addEventListener("click", function () {
                    let dataToSave = `${signals[i].metadata}\n${signals[i].data.join("\n")}`;
                    const blob = new Blob([dataToSave], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `segmented_data_${index}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            }
        }

        function plotData(data, plotId, xLabel, yLabel) {
            const trace = {
                x: Array.from({ length: data.length }, (v, k) => k + 1),
                y: data,
                mode: 'lines',
                type: 'scatter',
                line: { shape: 'linear' },
            };
            const layout = {
                xaxis: { title: xLabel },
                yaxis: { title: yLabel },
                margin: { l: 50, r: 50, t: 30, b: 50 },
                autosize: true,
            };
            Plotly.newPlot(plotId, [trace], layout);
        }

        function initializeSlider(maxValue) {
            const slider = document.getElementById('rangeSlider');
            if (slider.noUiSlider) {
                slider.noUiSlider.destroy();
            }
            noUiSlider.create(slider, {
                start: [0, maxValue - 1],
                connect: true,
                range: { min: 0, max: maxValue - 1 },
                tooltips: [true, true],
                format: {
                    to: (value) => Math.round(value),
                    from: (value) => Number(value),
                },
            });

            slider.noUiSlider.on('update', updateSegments);
        }

        function updateSegments(values) {
            const start = parseInt(values[0]);
            const end = parseInt(values[1]);
        
            if (start >= 0 && end >= start) {
                signals.forEach((signal, i) => {
                    let segmentData = signal.data.slice(start, end + 1);
                    
                    if (document.getElementById(`plotArea${i + 1}`)) {
                        plotData(segmentData, `plotArea${i + 1}`);
                    }
                    if (document.getElementById(signal.sampleCountId)) {
                        document.getElementById(signal.sampleCountId).innerText = `Sample size: ${segmentData.length}`;
                    }
                });
        
                document.getElementById("segmentInfo").innerText = `Segment start: ${start}\nSegment end: ${end}\nSegment size: ${end - start + 1}`;
            } else {
                document.getElementById("segmentInfo").innerText = "Invalid segment range";
            }
        }
        
        document.getElementById('segmentButton').addEventListener('click', function () {
            const [start, end] = document.getElementById('rangeSlider').noUiSlider.get().map(Number);
        
            if (start >= 0 && end >= start) {
                signals.forEach((signal, i) => {
                    signals[i].data = signal.data.slice(start, end + 1);
                    
                    if (document.getElementById(signal.sampleCountId)) {
                        document.getElementById(signal.sampleCountId).innerText = `Sample size: ${signals[i].data.length}`;
                    }
                });
        
                // Reinitialize the slider with the new data length
                initializeSlider(signals[0].data.length);
        
                // Clear segment info
                document.getElementById('segmentInfo').innerText = '';
            } else {
                alert('Invalid segment range');
            }
        });
        

        function resetUI(plotId, dataName, metadataName, sampleCountId) {
            window[dataName] = [];
            window[metadataName] = '';
            document.getElementById(plotId).innerHTML = '';
            document.getElementById(sampleCountId).innerText = '';
        }

        document.addEventListener("DOMContentLoaded", function () {
            const fileInputsContainer = document.getElementById("fileInputsContainer");
            const toggleButton = document.getElementById("toggleInputs");

            // ✅ Hide file inputs on page load
            fileInputsContainer.style.display = "none";
            
            // ✅ Set button text to "Show File Inputs" initially
            toggleButton.innerText = "Show File Inputs";

            // ✅ Toggle function
            toggleButton.addEventListener("click", function () {
                if (fileInputsContainer.style.display === "none") {
                    fileInputsContainer.style.display = "flex"; // Show inputs
                    this.innerText = "Hide File Inputs";
                } else {
                    fileInputsContainer.style.display = "none"; // Hide inputs
                    this.innerText = "Show File Inputs";
                }
            });
        });
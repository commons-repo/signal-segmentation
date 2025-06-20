
        let originalData1 = [], originalData2 = [], originalData3 = [];
        let metadata1 = '', metadata2 = '', metadata3 = '';

        const fileInputs = [
            { input: 'fileInput1', plot: 'plotArea1', save: 'saveButton1', data: 'originalData1', metadata: 'metadata1', sampleCount: 'sampleCount1', xLabel: '', yLabel: '' },
            { input: 'fileInput2', plot: 'plotArea2', save: 'saveButton2', data: 'originalData2', metadata: 'metadata2', sampleCount: 'sampleCount2', xLabel: '', yLabel: 'Signal Value' },
            { input: 'fileInput3', plot: 'plotArea3', save: 'saveButton3', data: 'originalData3', metadata: 'metadata3', sampleCount: 'sampleCount3', xLabel: 'Sample Number', yLabel: '' },
        ];

        fileInputs.forEach(({ input, plot, save, data, metadata, sampleCount, xLabel, yLabel }, index) => {
            const fileInput = document.getElementById(input);
            const saveButton = document.getElementById(save);

            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                const reader = new FileReader();

                reader.onload = function(e) {
                    resetUI(plot, data, metadata, sampleCount);

                    const lines = e.target.result.split('\n');
                    window[metadata] = lines.slice(0, 3).join('\n');
                    window[data] = lines.slice(3).filter(line => line.trim() !== '').map(Number);

                    // Plot data
                    plotData(window[data], plot, xLabel, yLabel);

                    // Display total data count
                    document.getElementById(sampleCount).innerText = `Sample size: ${window[data].length}`;

                    // Initialize slider for the first loaded file
                    if (index === 0) initializeSlider(window[data].length);
                };

                reader.readAsText(file);
            });

            saveButton.addEventListener('click', function() {
                const dataToSave = `${window[metadata]}\n${window[data].join('\n')}`;
                const blob = new Blob([dataToSave], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `segmented_data_${index + 1}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        });

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

        function updateSegments(values, handle) {
            const start = parseInt(values[0]);
            const end = parseInt(values[1]);

            if (start >= 0 && end >= start) {
                fileInputs.forEach(({ plot, data, sampleCount, xLabel, yLabel }) => {
                    const segmentData = window[data].slice(start, end + 1);
                    plotData(segmentData, plot, xLabel, yLabel);
                    document.getElementById(sampleCount).innerText = `Sample size: ${segmentData.length}`;
                });

                document.getElementById('segmentInfo').innerText = `Segment start: ${start}\nSegment end: ${end}\nSegment size: ${end - start + 1}`;
            } else {
                document.getElementById('segmentInfo').innerText = 'Invalid segment range';
            }
        }

        document.getElementById('segmentButton').addEventListener('click', function () {
            const [start, end] = document.getElementById('rangeSlider').noUiSlider.get().map(Number);

            if (start >= 0 && end >= start) {
                fileInputs.forEach(({ data, sampleCount }) => {
                    window[data] = window[data].slice(start, end + 1);
                    document.getElementById(sampleCount).innerText = `Sample size: ${window[data].length}`;
                });

                // Reinitialize the slider with the new data length
                initializeSlider(window[fileInputs[0].data].length);

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

        let originalData = [];
        let metadata = '';

        document.getElementById('fileInput').addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                // Reset all displayed information
                resetUI();

                const lines = e.target.result.split('\n');
                metadata = lines.slice(0, 3).join('\n');
                const data = lines.slice(3).filter(line => line.trim() !== '').map(Number);

                originalData = data;

                // Plot data
                plotData(data);

                // Initialize range slider
                initializeSlider(data.length);
                
                // Display total data count
                document.getElementById('sampleCount').innerText = `Sample size: ${data.length}`;
            };

            reader.readAsText(file);
        });

        function plotData(data) {
            const trace = {
                x: Array.from({length: data.length}, (v, k) => k + 1),
                y: data,
                mode: 'lines', // Ensure the chart is rendered as a line chart
                type: 'scatter',
                line: { shape: 'linear' } // Define line shape
            };
            const layout = {
                title: 'Signal Data',
                xaxis: {title: 'Sample Number'},
                yaxis: {title: 'Signal Value'},
                margin: {l: 50, r: 50, t: 50, b: 50},
                autosize: true
            };
            Plotly.newPlot('plotArea', [trace], layout);
        }

        function initializeSlider(maxValue) {
            const slider = document.getElementById('rangeSlider');
            if (slider.noUiSlider) {
                slider.noUiSlider.destroy();
            }
            noUiSlider.create(slider, {
                start: [0, maxValue - 1],
                connect: true,
                range: {
                    min: 0,
                    max: maxValue - 1
                },
                tooltips: [true, true],
                format: {
                    to: value => Math.round(value),
                    from: value => Number(value)
                }
            });

            slider.noUiSlider.on('update', updateSegment);
        }

        function updateSegment(values, handle) {
            const start = parseInt(values[0]);
            const end = parseInt(values[1]);
            if (start >= 0 && end >= start && end < originalData.length) {
                const segmentData = originalData.slice(start, end + 1);

                const trace = {
                    x: Array.from({length: segmentData.length}, (v, k) => start + k + 1),
                    y: segmentData,
                    mode: 'lines', // Ensure the chart is rendered as a line chart
                    type: 'scatter',
                    line: { shape: 'linear' } // Define line shape
                };
                const layout = {
                    title: '',
                    xaxis: {title: 'Sample'},
                    yaxis: {title: 'Value'},
                    margin: {l: 50, r: 50, t: 50, b: 50},
                    autosize: true
                };
                Plotly.newPlot('plotArea', [trace], layout);

                // Update segment info
                document.getElementById('segmentInfo').innerText = `Segment start: ${start}\nSegment end: ${end}\nSegment size: ${end - start + 1}`;
            } else {
                document.getElementById('segmentInfo').innerText = 'Invalid segment range';
            }
        }

        function resetUI() {
            originalData = [];
            metadata = '';
            document.getElementById('plotArea').innerHTML = '';
            document.getElementById('sampleCount').innerText = '';
            document.getElementById('segmentInfo').innerText = '';
            const slider = document.getElementById('rangeSlider');
            if (slider.noUiSlider) {
                slider.noUiSlider.destroy();
            }
        }

        document.getElementById('segmentButton').addEventListener('click', function() {
            const [start, end] = document.getElementById('rangeSlider').noUiSlider.get().map(Number);

            if (start >= 0 && end >= start && end < originalData.length) {
                // Update originalData to the new segmented data
                originalData = originalData.slice(start, end + 1);

                // Plot new segmented data
                plotData(originalData);

                // Reinitialize the slider with the new data length
                initializeSlider(originalData.length);

                // Update sample count display
                document.getElementById('sampleCount').innerText = `Sample size: ${originalData.length}`;

                // Clear segment info
                document.getElementById('segmentInfo').innerText = '';
            } else {
                alert('Invalid segment range');
            }
        });

        document.getElementById('saveButton').addEventListener('click', function() {
            const dataToSave = `${metadata}\n${originalData.join('\n')}`;
                
            // Creating a blob and a link to download the file
            const blob = new Blob([dataToSave], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'segmented_data.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
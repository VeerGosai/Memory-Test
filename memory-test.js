document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const startTestBtn = document.getElementById('start-test');
    const stopTestBtn = document.getElementById('stop-test');
    const releaseMemoryBtn = document.getElementById('release-memory');
    const chunkSizeInput = document.getElementById('chunk-size');
    const maxMemoryInput = document.getElementById('max-memory');
    const allocatedMemoryEl = document.getElementById('allocated-memory');
    const allocationSpeedEl = document.getElementById('allocation-speed');
    const testDurationEl = document.getElementById('test-duration');
    const memoryProgressEl = document.getElementById('memory-progress');
    const resultsEl = document.getElementById('results');
    const browserStatsEl = document.getElementById('browser-stats');
    const memoryGraphCanvas = document.getElementById('memory-graph');
    const browserMemoryLegend = document.getElementById('browser-memory-legend');
    
    // Test variables
    let memoryChunks = [];
    let isRunning = false;
    let startTime = 0;
    let allocatedBytes = 0;
    let testInterval;
    let graphUpdateInterval;
    let lastUpdateTime = 0;
    let lastAllocatedBytes = 0;
    
    // Chart.js instance
    let memoryChart;
    
    // Data for the graph
    let memoryHistory = [];
    let browserMemoryHistory = [];
    let timeLabels = [];
    
    // Check if browser supports performance memory API
    const hasPerformanceMemory = window.performance && window.performance.memory;
    
    if (hasPerformanceMemory) {
        browserMemoryLegend.style.display = 'flex';
        updateBrowserMemoryStats();
    } else {
        browserStatsEl.innerHTML = '<p>Performance Memory API not available in this browser</p>';
    }
    
    // Initialize Chart.js
    function initChart() {
        const ctx = memoryGraphCanvas.getContext('2d');
        
        memoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Allocated Memory',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Browser JS Heap',
                        data: [],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: true,
                        hidden: !hasPerformanceMemory
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (seconds)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Memory Usage'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatBytes(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatBytes(context.parsed.y);
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                animation: {
                    duration: 0 // Disable animations for better performance
                }
            }
        });
    }
    
    // Functions
    function startTest() {
        // Reset test state
        memoryChunks = [];
        allocatedBytes = 0;
        startTime = performance.now();
        lastUpdateTime = startTime;
        lastAllocatedBytes = 0;
        isRunning = true;
        
        // Reset graph data
        memoryHistory = [];
        browserMemoryHistory = [];
        timeLabels = [];
        
        // Update UI
        startTestBtn.disabled = true;
        stopTestBtn.disabled = false;
        releaseMemoryBtn.disabled = true;
        memoryProgressEl.style.width = '0%';
        resultsEl.innerHTML = '<h2>Test Results</h2><p>Test in progress...</p>';
        
        // Reset chart data
        if (memoryChart) {
            memoryChart.data.labels = [];
            memoryChart.data.datasets[0].data = [];
            memoryChart.data.datasets[1].data = [];
            memoryChart.update();
        }
        
        // Get test parameters
        const chunkSizeMB = parseInt(chunkSizeInput.value, 10);
        const maxMemoryMB = parseInt(maxMemoryInput.value, 10);
        
        // Convert to bytes
        const chunkSizeBytes = chunkSizeMB * 1024 * 1024;
        const maxMemoryBytes = maxMemoryMB * 1024 * 1024;
        
        // Start the graph update interval - changed from 1000ms to 100ms
        graphUpdateInterval = setInterval(updateGraph, 100); // Update every 0.1 seconds
        
        // Start the allocation loop
        testInterval = setInterval(() => {
            if (!isRunning) {
                clearInterval(testInterval);
                return;
            }
            
            try {
                // Allocate a new chunk of memory
                const newChunk = new Uint8Array(chunkSizeBytes);
                
                // Fill with random data to ensure it's actually allocated
                for (let i = 0; i < newChunk.length; i += 1024) {
                    newChunk[i] = Math.random() * 255;
                }
                
                memoryChunks.push(newChunk);
                allocatedBytes += chunkSizeBytes;
                
                // Update UI
                updateStats();
                
                // Check if we've reached the maximum memory
                if (allocatedBytes >= maxMemoryBytes) {
                    stopTest(true);
                }
            } catch (e) {
                // Handle out of memory error with improved message
                stopTest(false);
                const allocatedGB = (allocatedBytes / (1024 * 1024 * 1024)).toFixed(2);
                resultsEl.innerHTML = `
                    <h2>Test Results</h2>
                    <p class="error">🚫 RAM limit hit at ${allocatedGB} GB!</p>
                    <p>Your browser cannot allocate more memory. This might be due to:</p>
                    <ul>
                        <li>Physical RAM limitations</li>
                        <li>Browser memory restrictions</li>
                        <li>System memory pressure</li>
                    </ul>
                    <p>Maximum allocated memory: ${formatBytes(allocatedBytes)}</p>
                    <p>Test duration: ${formatTime(performance.now() - startTime)}</p>
                `;
                
                // Enable release memory button
                releaseMemoryBtn.disabled = false;
            }
        }, 100); // Try to allocate memory every 100ms
    }
    
    function stopTest(completed = false) {
        isRunning = false;
        clearInterval(testInterval);
        clearInterval(graphUpdateInterval);
        
        // Update UI
        startTestBtn.disabled = false;
        stopTestBtn.disabled = true;
        releaseMemoryBtn.disabled = false;
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Display final results
        if (completed) {
            const allocatedGB = (allocatedBytes / (1024 * 1024 * 1024)).toFixed(2);
            resultsEl.innerHTML = `
                <h2>Test Results</h2>
                <p class="success">✅ Test completed successfully!</p>
                <p>You successfully allocated ${allocatedGB} GB of browser memory.</p>
                <p>Total allocated memory: ${formatBytes(allocatedBytes)}</p>
                <p>Average allocation speed: ${formatBytes(allocatedBytes / (duration / 1000))}/s</p>
                <p>Test duration: ${formatTime(duration)}</p>
            `;
        }
        
        // Take one final measurement for the graph
        updateGraph();
    }
    
    function releaseMemory() {
        // Clean up memory
        memoryChunks = [];
        allocatedBytes = 0;
        
        // Force garbage collection if possible (only works in some debug modes)
        if (window.gc) {
            window.gc();
        }
        
        // Update UI
        allocatedMemoryEl.textContent = "0 MB";
        memoryProgressEl.style.width = "0%";
        releaseMemoryBtn.disabled = true;
        
        // Add release message
        resultsEl.innerHTML += `
            <p class="info">🧹 Memory has been released. The browser's garbage collector will reclaim it shortly.</p>
        `;
        
        // Take one final measurement for the graph
        updateGraph();
        
        // Update the browser memory stats after a short delay to allow GC
        setTimeout(updateBrowserMemoryStats, 500);
    }
    
    function updateStats() {
        // Calculate current stats
        const currentTime = performance.now();
        const elapsedTime = currentTime - startTime;
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        
        // Update allocated memory display
        allocatedMemoryEl.textContent = formatBytes(allocatedBytes);
        
        // Update progress bar
        const maxMemoryBytes = parseInt(maxMemoryInput.value, 10) * 1024 * 1024;
        const progressPercent = (allocatedBytes / maxMemoryBytes) * 100;
        memoryProgressEl.style.width = `${Math.min(progressPercent, 100)}%`;
        
        // Update test duration
        testDurationEl.textContent = formatTime(elapsedTime);
        
        // Calculate and update allocation speed
        if (timeSinceLastUpdate > 500) { // Update speed every 500ms for more stable readings
            const bytesAllocatedSinceLastUpdate = allocatedBytes - lastAllocatedBytes;
            const speedBytesPerSec = bytesAllocatedSinceLastUpdate / (timeSinceLastUpdate / 1000);
            allocationSpeedEl.textContent = formatBytes(speedBytesPerSec) + '/s';
            
            // Update last values
            lastUpdateTime = currentTime;
            lastAllocatedBytes = allocatedBytes;
        }
        
        // Update browser memory stats if available
        if (hasPerformanceMemory) {
            updateBrowserMemoryStats();
        }
    }
    
    function updateBrowserMemoryStats() {
        if (hasPerformanceMemory) {
            const memory = window.performance.memory;
            
            browserStatsEl.innerHTML = `
                <div class="browser-stat">
                    <span>Used JS Heap:</span>
                    <span>${formatBytes(memory.usedJSHeapSize)}</span>
                </div>
                <div class="browser-stat">
                    <span>Total JS Heap:</span>
                    <span>${formatBytes(memory.totalJSHeapSize)}</span>
                </div>
            `;
        }
    }
    
    function updateGraph() {
        // Get current time and allocated memory
        const currentTime = performance.now();
        const elapsedSecs = ((currentTime - startTime) / 1000).toFixed(1); // Show tenths of seconds
        
        // Add data points to local arrays
        timeLabels.push(elapsedSecs);
        memoryHistory.push(allocatedBytes);
        
        // Update Chart.js data
        if (memoryChart) {
            // Add labels and allocated memory data
            memoryChart.data.labels.push(elapsedSecs);
            memoryChart.data.datasets[0].data.push(allocatedBytes);
            
            // Add browser memory data if available
            if (hasPerformanceMemory) {
                const memory = window.performance.memory;
                browserMemoryHistory.push(memory.usedJSHeapSize);
                memoryChart.data.datasets[1].data.push(memory.usedJSHeapSize);
            } else {
                memoryChart.data.datasets[1].data.push(null);
            }
            
            // Limit data points to avoid performance issues with more frequent updates
            if (memoryChart.data.labels.length > 200) { // Increased from 100 to 200
                memoryChart.data.labels.shift();
                memoryChart.data.datasets.forEach(dataset => dataset.data.shift());
            }
            
            // Update the chart
            memoryChart.update('none'); // Use 'none' mode for better performance with frequent updates
        }
    }
    
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
        else return (bytes / 1073741824).toFixed(2) + ' GB';
    }
    
    function formatTime(ms) {
        if (ms < 1000) return ms.toFixed(0) + 'ms';
        else if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
        else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(1);
            return minutes + 'm ' + seconds + 's';
        }
    }
    
    // Initialize Chart.js when the page loads
    initChart();
    
    // Make canvas responsive
    function resizeCanvas() {
        // Chart.js will handle the resizing automatically
        if (memoryChart) {
            memoryChart.resize();
        }
    }
    
    // Resize canvas on window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    startTestBtn.addEventListener('click', startTest);
    stopTestBtn.addEventListener('click', () => stopTest(false));
    releaseMemoryBtn.addEventListener('click', releaseMemory);
});

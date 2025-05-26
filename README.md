# Browser RAM Memory Test

A web-based tool that allows you to test how much memory your browser can allocate before hitting limits, visualize memory usage in real-time, and measure allocation performance.

![Memory Test Deployment](https://veergosai.github.io/Memory-Test/)

## Features

- 📊 Real-time memory usage graph with Chart.js
- 🚀 Control memory allocation chunk size and maximum target
- ⏱️ Measure allocation speed in real-time
- 📈 Monitor both explicitly allocated memory and browser's JS heap
- 🧹 Release allocated memory on demand
- ⚠️ Detect when browser memory limits are reached
- 📱 Responsive design that works on desktop and mobile

## Why Use This Tool?

- **Browser Testing**: Understand the memory limitations of different browsers
- **System Benchmarking**: Compare memory allocation performance across devices
- **Web Development**: Test how your web applications might behave with high memory usage
- **Educational**: Learn about browser memory management and limitations

## How to Use

1. Open `index.html` in your browser (works offline)
2. Configure test parameters:
   - **Chunk Size (MB)**: How much memory to allocate in each step
   - **Max Memory (MB)**: Target memory limit to reach
3. Click "Start Test" to begin allocating memory
4. Watch the real-time graph and statistics as memory is allocated
5. The test will automatically stop when either:
   - The target memory limit is reached
   - The browser can't allocate any more memory
6. Click "Release Memory" to free the allocated memory

## Technical Details

This tool works by creating typed arrays (Uint8Array) of specified sizes and retaining references to them. It uses:

- **JavaScript**: Core memory allocation logic
- **Chart.js**: Real-time data visualization
- **Performance API**: Browser memory usage statistics (Chrome/Chromium browsers only)

Memory is allocated in chunks to avoid freezing the browser, and the tool measures:

- Total allocated memory
- Allocation speed (MB/s)
- Test duration
- Browser's own JavaScript heap usage

## Browser Compatibility

- **Full Functionality**: Chrome, Edge, Opera, and other Chromium-based browsers
- **Basic Functionality**: Firefox, Safari (without browser memory stats)
- **Mobile Support**: Works on mobile browsers with responsive UI

## Memory Limitations

Browser memory limits depend on:

1. Available system memory
2. Browser implementation
3. Operating system constraints
4. 32-bit vs 64-bit browser
5. Device capabilities

Most modern browsers on 64-bit systems can allocate several GB of memory, while mobile devices will have lower limits.

## Safety

This tool is safe to use and doesn't access any sensitive information. Memory is allocated only within the browser's sandbox. However, allocating large amounts of memory may cause your browser or system to become less responsive. Use the "Release Memory" button if your system becomes sluggish.

## License

MIT License - feel free to use, modify, and distribute this code for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


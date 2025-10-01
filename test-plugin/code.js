// Minimal test plugin
console.log('Plugin code starting...');

try {
  figma.showUI(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Plugin</title>
    </head>
    <body>
      <h1>Test Plugin Loaded Successfully</h1>
      <script>
        console.log('UI script loaded');
        parent.postMessage({ pluginMessage: { type: 'test' } }, '*');
      </script>
    </body>
    </html>
  `, { width: 300, height: 200 });

  figma.ui.onmessage = (msg) => {
    console.log('Received message:', msg);
    if (msg.type === 'test') {
      console.log('Test message received successfully');
    }
  };

  console.log('Plugin initialized successfully');
} catch (error) {
  console.error('Plugin initialization error:', error);
}
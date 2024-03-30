//create browser websocket client

const ws = new WebSocket(`ws://localhost:${port}`);
ws.onopen = () => {
    console.log('vanillin: connected to server');
};
ws.onmessage = (event) => {
    //refresh page
    console.log('vanillin: message from server:', event.data);
    if (event.data === 'reload') location.reload();
};
ws.onclose = () => {
    console.log('vanillin: disconnected from server');
};
ws.onerror = (error) => {
    console.error('vanillin: error:', error);
};
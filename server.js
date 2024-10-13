const WebSocket = require('ws');

module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.status(200).send('WebSocket server is running');
        return;
    }

    const wss = new WebSocket.Server({ noServer: true });
    
    res.socket.server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });
    });
};

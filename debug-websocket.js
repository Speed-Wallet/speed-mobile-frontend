// Debug script to test WebSocket connection
const WebSocket = require('ws');

const RPC_ENDPOINT = 'wss://solana-rpc.publicnode.com';

console.log('Testing WebSocket connection to:', RPC_ENDPOINT);

const ws = new WebSocket(RPC_ENDPOINT);

let pingInterval;

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Send a test RPC call
    const testMessage = {
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth"
    };
    
    ws.send(JSON.stringify(testMessage));
    console.log('📤 Sent test message:', testMessage);
    
    // Setup ping to keep connection alive
    pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const ping = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "getHealth"
            };
            ws.send(JSON.stringify(ping));
            console.log('💓 Sent keepalive ping');
        }
    }, 30000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received message:', message);
    } catch (e) {
        console.log('📥 Received raw data:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    if (pingInterval) {
        clearInterval(pingInterval);
    }
    
    // Common close codes:
    // 1000: Normal closure
    // 1001: Going away
    // 1002: Protocol error
    // 1003: Unsupported data
    // 1006: Abnormal closure
    // 1011: Server error
    // 1012: Service restart
    // 1013: Try again later
    // 1014: Bad gateway
    // 1015: TLS handshake failure
    
    const closeCodeMeanings = {
        1000: 'Normal closure',
        1001: 'Going away (server/client leaving)',
        1002: 'Protocol error',
        1003: 'Unsupported data type',
        1006: 'Abnormal closure (no close frame)',
        1011: 'Server error',
        1012: 'Service restart',
        1013: 'Try again later',
        1014: 'Bad gateway',
        1015: 'TLS handshake failure'
    };
    
    console.log(`Close code meaning: ${closeCodeMeanings[code] || 'Unknown'}`);
});

// Keep the script running for 2 minutes to test connection stability
setTimeout(() => {
    console.log('⏰ Test timeout - closing connection');
    ws.close(1000, 'Test completed');
}, 120000);

console.log('⏱️  Test will run for 2 minutes...');

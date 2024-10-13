const video = document.getElementById('video');
const startButton = document.getElementById('start');

let localStream;
let peerConnection;

// WebSocket接続の設定
const socket = new WebSocket('ws://your-websocket-server');

socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    if (data.offer) {
        await createAnswer(data.offer);
    } else if (data.answer) {
        await handleAnswer(data.answer);
    } else if (data.iceCandidate) {
        await handleIceCandidate(data.iceCandidate);
    }
};

startButton.addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    video.srcObject = localStream;
    
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.send(JSON.stringify({ iceCandidate: event.candidate }));
        }
    };

    peerConnection.ontrack = event => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.autoplay = true;
        document.body.appendChild(remoteVideo);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ offer }));
});

async function createAnswer(offer) {
    peerConnection = new RTCPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ answer }));
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate(iceCandidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
}

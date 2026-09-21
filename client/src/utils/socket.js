import { io } from 'socket.io-client';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'https://api.luxyield.com';
const socket = io(SOCKET_URL, {
	transports: ['polling', 'websocket'],
	upgrade: true,
});
export default socket;

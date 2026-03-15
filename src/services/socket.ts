import { io } from "socket.io-client"
import API_BASE from "../config/api"

const socket = io(API_BASE, {
  transports: ["websocket"],
  autoConnect: true,
})

export default socket

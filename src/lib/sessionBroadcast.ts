// Store active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Broadcast message to all connections in a session
export function broadcastToSession(
  sessionId: string, 
  message: any, 
  excludeController?: ReadableStreamDefaultController
) {
  const sessionConnections = connections.get(sessionId);
  if (!sessionConnections) return;

  const data = JSON.stringify(message);
  
  sessionConnections.forEach(controller => {
    if (controller !== excludeController) {
      try {
        controller.enqueue(`data: ${data}\n\n`);
      } catch (error) {
        // Remove broken connection
        sessionConnections.delete(controller);
      }
    }
  });
}

// Add connection to session
export function addConnection(sessionId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(sessionId)) {
    connections.set(sessionId, new Set());
  }
  connections.get(sessionId)!.add(controller);
}

// Remove connection from session
export function removeConnection(sessionId: string, controller: ReadableStreamDefaultController) {
  const sessionConnections = connections.get(sessionId);
  if (sessionConnections) {
    sessionConnections.delete(controller);
    if (sessionConnections.size === 0) {
      connections.delete(sessionId);
    }
  }
}

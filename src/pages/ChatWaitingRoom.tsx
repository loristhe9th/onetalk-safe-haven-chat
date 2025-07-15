// src/pages/ChatWaitingRoom.tsx

import { useParams } from "react-router-dom";
import { Heart } from "lucide-react";

export default function ChatWaitingRoom() {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Heart className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Finding a listener...</h1>
        <p className="text-muted-foreground">
          Please wait while we connect you.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  );
}
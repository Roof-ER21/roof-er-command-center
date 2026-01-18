import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Paperclip, Menu, X, MessageSquare, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageContent } from "@/components/MessageContent";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    document: {
      name: string;
      path: string;
      category: string;
    };
    content: string;
    score: number;
  }>;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastMessageAt: Date;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`chat_${Date.now()}`);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Susan, your AI field assistant. I can help you with insurance claims, damage assessments, email drafts, and answering roofing questions. How can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (showWelcome) {
      setShowWelcome(false);
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput("");
    setIsLoading(true);

    try {
      // Call the API endpoint
      const response = await fetch(`/api/field/chat/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Susan AI');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.data.response,
        timestamp: new Date(data.data.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(`chat_${Date.now()}`);
    setMessages([]);
    setShowWelcome(true);
    setShowSidebar(false);

    // Show welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Susan, your AI field assistant. I can help you with insurance claims, damage assessments, email drafts, and answering roofing questions. How can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const quickQuestions = [
    "How do I write a professional insurance claim email?",
    "What should I look for in a roof damage assessment?",
    "Help me create a follow-up email for a customer",
    "What are the key steps in filing a roofing claim?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              title="Chat History"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-7 w-7 text-sky-500" />
              Chat with Susan
            </h1>
          </div>
          <p className="text-muted-foreground">AI-powered field assistant for roofing operations</p>
        </div>
        <Button
          variant="outline"
          onClick={handleNewChat}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r z-50 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-sky-500" />
                  Chat History
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* New Chat Button */}
              <div className="p-4 border-b">
                <Button
                  onClick={handleNewChat}
                  className="w-full bg-sky-500 hover:bg-sky-600"
                >
                  + New Chat
                </Button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs mt-1">Start chatting to see history here</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg hover:bg-muted cursor-pointer mb-2 transition-colors"
                      onClick={() => {
                        // Load session logic here
                        setShowSidebar(false);
                      }}
                    >
                      <h3 className="font-medium text-sm mb-1">{session.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{session.preview}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{session.messageCount} messages</span>
                        <span>•</span>
                        <span>{new Date(session.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                <Bot className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" />
                  Welcome to Susan AI
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your intelligent field assistant for roofing operations. I can help with insurance claims,
                  damage assessments, professional emails, and answer technical questions.
                </p>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
                {quickQuestions.map((question, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-sky-500 hover:bg-sky-500/5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm group-hover:text-sky-600 transition-colors">
                        {question}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {!showWelcome && messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-sky-400 to-sky-600 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-sm">
                  {message.role === 'assistant' ? (
                    <MessageContent content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Susan is typing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask Susan anything about roofing, claims, or field work..."
                  disabled={isLoading}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoading}
                title="Attach file (coming soon)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-sky-500 hover:bg-sky-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}

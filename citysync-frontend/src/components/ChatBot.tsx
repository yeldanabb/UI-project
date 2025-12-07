// Author: Orynbassar Abylaikhan (xorynba00)
// Role: Provide an in-app assistant that answers user questions about events using the local JSON database.
// Notes: The key part of this component is how it formats event data into JSON and uses an LLM strictly as a database lookup tool.
//        I was using one of the deepseek keys which later expired, but believe me it worked perfectly during development xD

import { useState, useRef, useEffect } from "react";
import { fetchEvents, fetchCategories } from "../api/api";
import type { Event, Category } from "../types/types";
import "../styles/chatbot.css";
import { ChatBubbleBottomCenterIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  // Stores conversation messages
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the CitySync assistant. I can tell you about upcoming events and answer your questions. How can I help you?"
    }
  ]);

  // States for input, loading indicator and fetched data
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load events and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch everything in parallel
        const [eventsRes, categoriesRes] = await Promise.all([ 
          fetchEvents(),
          fetchCategories()
        ]);
        setEvents(eventsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Auto-scroll whenever messages change 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Converts event objects to JSON so LLM uses it as database
  const formatEventsAsJSON = (eventsToFormat: Event[]): string => {
    if (eventsToFormat.length === 0) {
      return "[]";
    }

    // Preparing event objects with meaningful fields
    const eventsJSON = eventsToFormat.map(event => {
      const eventData: any = {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        category: {
          id: event.category.id,
          name: event.category.name,
          slug: event.category.slug
        }
      };


      // Add optional fields only if they exist 
      if (event.description && event.description.trim()) {
        eventData.description = event.description;
      }
      
      if (event.admission && event.admission.trim()) {
        eventData.admission = event.admission;
      }
      
      if (event.external_links && event.external_links.trim()) {
        eventData.external_links = event.external_links;
      }
      
      if (event.contact_info_details) {
        eventData.contact_info = {};
        if (event.contact_info_details.address && event.contact_info_details.address.trim()) {
          eventData.contact_info.address = event.contact_info_details.address;
        }
        if (event.contact_info_details.phone && event.contact_info_details.phone.trim()) {
          eventData.contact_info.phone = event.contact_info_details.phone;
        }
        if (event.contact_info_details.email && event.contact_info_details.email.trim()) {
          eventData.contact_info.email = event.contact_info_details.email;
        }
      }

      return eventData;
    });

    return JSON.stringify(eventsJSON, null, 2);
  };


  // Sends user message and calls Deepseek to generate assistant response
  const sendMessage = async () => {
    // Preventing empty messages or spam while loading
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // JSON database for LLM
      const eventsJSON = formatEventsAsJSON(events);
      const categoriesJSON = JSON.stringify(categories, null, 2);

      // Special prompt which is used to force LLM to behave like a database lookup tool
      const systemPrompt = `You are a database query assistant for CitySync event platform. Your ONLY job is to look up events from the provided JSON data and return EXACT matches.

CRITICAL RULES - VIOLATION MEANS FAILURE:
1. You MUST search the JSON data below for events matching the user's query
2. You MUST return ONLY data that exists in the JSON - character by character exact match
3. If an event is not found in JSON, respond: "I don't have that event in the database."
4. NEVER invent, guess, or infer any information not explicitly in the JSON
5. When quoting event details, copy them EXACTLY from the JSON
6. Start your response with "According to the database:" when providing event information

EVENTS DATABASE (JSON format):
${eventsJSON}

CATEGORIES DATABASE (JSON format):
${categoriesJSON}

EXAMPLE CORRECT RESPONSE:
User: "Tell me about Brno Christmas"
You: "According to the database: [search JSON for event with title containing 'Brno' and 'Christmas', then copy EXACT values from JSON]"

EXAMPLE INCORRECT RESPONSE (DO NOT DO THIS):
User: "Tell me about Brno Christmas"  
You: "Brno Christmas is a wonderful event..." [WRONG - you're making things up]

Remember: You are a database lookup tool. Only return what exists in the JSON data above.`;

      // Build conversation without last user message (added separately)
      const conversationMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send request to DeepSeek API
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-b78cada5a61c42188e095daf0ce76c5f"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationMessages,
            { 
              role: "user", 
              content: `Here is the current events database. Answer questions using ONLY this data:\n\n${eventsJSON}\n\nUser question: ${input}` 
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error("Error getting response");
      }

      const data = await response.json();
      // Append assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0]?.message?.content || "Sorry, I couldn't get a response."
      };

      // Fallback error response
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, an error occurred. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message with Enter (without Shift)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <ChatBubbleBottomCenterIcon style={{ width: '24px', height: '24px' }} />
        </button>
      )}

      {/* Chatbot window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>CitySync Assistant</h3>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Chat history */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <span className="typing-indicator">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button 
              className="chatbot-send"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <PaperAirplaneIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}


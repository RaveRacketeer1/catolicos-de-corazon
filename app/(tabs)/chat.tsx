import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, MessageCircle, Sparkles, Shield, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { geminiService } from '@/services/gemini';
import { FirebaseService } from '@/services/firebase';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  tokensUsed?: number;
}

export default function ChatTab() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => 'session-' + Date.now());
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { theme } = useTheme();
  const { user, updateTokenUsage } = useAuth();

  useEffect(() => {
    // Load chat history
    loadChatHistory();
    
    // Add welcome message if no history
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: 'Paz y bien. Soy su director espiritual virtual, formado en la doctrina católica tradicional. ¿En qué puedo acompañarle en su camino de fe?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const history = await FirebaseService.getChatHistory(user.id, sessionId);
      if (history.length > 0) {
        setMessages(history.reverse()); // Reverse to show oldest first
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const checkTokenLimit = (): boolean => {
    if (!user) return false;
    
    const remainingTokens = user.tokenLimit - user.tokensUsed;
    if (remainingTokens < 1000) { // Minimum 1K tokens required
      Alert.alert(
        'Límite de Tokens',
        'Has alcanzado tu límite mensual de tokens. Actualiza tu suscripción para continuar.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    return true;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || isLoading) return;
    
    if (!checkTokenLimit()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Save user message to Firebase
      await FirebaseService.saveChatMessage({
        id: userMessage.id,
        userId: user.id,
        content: userMessage.content,
        isUser: true,
        timestamp: userMessage.timestamp,
        sessionId,
      });

      // Get AI response from Gemini
      const { response, tokensUsed } = await geminiService.generateSpiritualResponse(
        userMessage.content,
        messages.slice(-5) // Last 5 messages for context
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        tokensUsed,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to Firebase
      await FirebaseService.saveChatMessage({
        id: aiMessage.id,
        userId: user.id,
        content: aiMessage.content,
        isUser: false,
        timestamp: aiMessage.timestamp,
        tokensUsed,
        sessionId,
      });

      // Update token usage
      await updateTokenUsage(tokensUsed);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Error', error.message || 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const remainingTokens = user ? user.tokenLimit - user.tokensUsed : 0;
  const tokenPercentage = user ? (user.tokensUsed / user.tokenLimit) * 100 : 0;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary]}
        style={styles.header}
      >
        <MessageCircle size={24} color="#FFFFFF" />
        <Text style={[styles.headerTitle, { color: theme.colors.liturgicalWhite }]}>
          Director Espiritual
        </Text>
        <View style={styles.tokenIndicator}>
          <Sparkles size={16} color="#FFD700" />
          <Text style={[styles.tokenText, { color: theme.colors.liturgicalWhite }]}>
            {Math.round(remainingTokens / 1000)}K restantes
          </Text>
        </View>
      </LinearGradient>

      <View style={[styles.safetyBanner, { backgroundColor: theme.colors.accentLight }]}>
        <Shield size={16} color="#8B5A2B" />
        <Text style={[styles.safetyText, { color: theme.colors.primary }]}>
          Conversación protegida por doctrina católica verificada
        </Text>
      </View>

      {/* Token Usage Warning */}
      {tokenPercentage > 80 && (
        <View style={[styles.warningBanner, { backgroundColor: theme.colors.warning }]}>
          <AlertCircle size={16} color="#FFFFFF" />
          <Text style={[styles.warningText, { color: theme.colors.liturgicalWhite }]}>
            {tokenPercentage > 95 ? 'Tokens casi agotados' : 'Tokens limitados restantes'}
          </Text>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.isUser ? styles.userMessage : styles.aiMessage
            ]}
          >
            <LinearGradient
              colors={
                msg.isUser 
                  ? [theme.colors.primary, theme.colors.primaryLight] 
                  : [theme.colors.surface, theme.colors.card]
              }
              style={styles.messageBubble}
            >
              <Text style={[
                styles.messageText,
                { color: msg.isUser ? theme.colors.liturgicalWhite : theme.colors.text }
              ]}>
                {msg.content}
              </Text>
              {msg.tokensUsed && (
                <Text style={[styles.tokenUsage, { 
                  color: msg.isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary 
                }]}>
                  {msg.tokensUsed} tokens utilizados
                </Text>
              )}
            </LinearGradient>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.card]}
              style={styles.loadingBubble}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                El director espiritual está reflexionando...
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border 
      }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.primaryLight,
              color: theme.colors.text
            }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Comparta su inquietud espiritual..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: (!message.trim() || isLoading) ? 0.5 : 1 }]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              style={styles.sendButtonGradient}
            >
              <Send size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.inputFooter}>
          <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
            {message.length}/500 caracteres
          </Text>
          <Text style={[styles.tokenEstimate, { color: theme.colors.textTertiary }]}>
            ~{Math.ceil(message.length / 4)} tokens estimados
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tokenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tokenText: {
    fontSize: 12,
    marginLeft: 4,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  safetyText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  tokenUsage: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    maxWidth: '85%',
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
  },
  tokenEstimate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
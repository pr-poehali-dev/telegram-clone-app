import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_AUTH = 'https://functions.poehali.dev/2ef31854-bd29-4059-a0af-de2739050b05';
const API_CONTACTS = 'https://functions.poehali.dev/d5e3fa8e-b3ad-4c68-9334-6dea9db17d25';
const API_MESSAGES = 'https://functions.poehali.dev/c24da0d0-ba08-4922-81d2-b03a6d4a3dfc';

interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

interface Group {
  id: number;
  name: string;
  members: number;
  lastMessage: string;
  time: string;
  unread?: number;
}

interface Message {
  id: number;
  text: string;
  time: string;
  sender_id: number;
  sender_name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function Index() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ type: 'contact' | 'group'; data: Contact | Group } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadContacts();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (selectedChat && user) {
      loadMessages();
    }
  }, [selectedChat, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = authMode === 'register' 
        ? { action: 'register', username, email, password }
        : { action: 'login', username, password };

      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsLoggedIn(true);
        toast({
          title: authMode === 'register' ? 'Регистрация успешна!' : 'Вход выполнен!',
          description: `Добро пожаловать, ${data.user.username}!`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Произошла ошибка',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_CONTACTS}?user_id=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setContacts(data.contacts || []);
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat || !user) return;
    
    try {
      const params = selectedChat.type === 'contact'
        ? `user_id=${user.id}&contact_id=${selectedChat.data.id}`
        : `user_id=${user.id}&group_id=${selectedChat.data.id}`;
      
      const response = await fetch(`${API_MESSAGES}?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          time: msg.time,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !user) return;

    try {
      const body = {
        sender_id: user.id,
        message_text: messageText,
        ...(selectedChat.type === 'contact' 
          ? { receiver_id: selectedChat.data.id } 
          : { group_id: selectedChat.data.id }
        ),
      };

      const response = await fetch(API_MESSAGES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages([...messages, {
          id: data.message_id,
          text: messageText,
          time: data.time,
          sender_id: user.id,
          sender_name: user.username,
        }]);
        setMessageText('');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  const openChat = (type: 'contact' | 'group', data: Contact | Group) => {
    setSelectedChat({ type, data });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl animate-scale-in backdrop-blur-sm bg-white/95">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg">
                <Icon name="MessageCircle" size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Мессенджер
              </h1>
              <p className="text-muted-foreground mt-2">
                {authMode === 'login' ? 'Войдите в аккаунт' : 'Создайте новый аккаунт'}
              </p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-lg h-12 border-2 focus:border-purple-500"
                  required
                  autoFocus
                />
              </div>
              
              {authMode === 'register' && (
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg h-12 border-2 focus:border-purple-500"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg h-12 border-2 focus:border-purple-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
              >
                {loading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  {authMode === 'login' 
                    ? 'Нет аккаунта? Зарегистрироваться' 
                    : 'Есть аккаунт? Войти'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedChat) {
    const isContact = selectedChat.type === 'contact';
    const chatData = selectedChat.data;
    const isOnline = isContact && (chatData as Contact).online;

    return (
      <div className="min-h-screen p-4 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl backdrop-blur-sm bg-white/95 overflow-hidden h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedChat(null)}
                  >
                    <Icon name="ArrowLeft" size={24} />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-white text-purple-600 font-semibold">
                        {isContact 
                          ? chatData.name.split(' ').map(n => n[0]).join('')
                          : <Icon name="Users" size={20} />
                        }
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{chatData.name}</h2>
                    <p className="text-xs text-white/80">
                      {isContact 
                        ? (isOnline ? 'онлайн' : 'не в сети')
                        : `${(chatData as Group).members} участников`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-purple-50/30">
              <ScrollArea className="h-full p-4">
                <div ref={scrollRef} className="space-y-3">
                  {messages.map((message, index) => {
                    const isMine = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : 'bg-white text-gray-900 shadow-sm'
                          }`}
                        >
                          {!isMine && (
                            <p className="text-xs font-semibold mb-1 text-purple-600">{message.sender_name}</p>
                          )}
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-purple-500 hover:text-purple-600"
                >
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  type="text"
                  placeholder="Написать сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 h-10 border-purple-200 focus:border-purple-500"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={!messageText.trim()}
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl backdrop-blur-sm bg-white/95 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                  <AvatarFallback className="bg-white text-purple-600 font-semibold">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{user?.username}</h2>
                  <p className="text-sm text-white/80">онлайн</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsLoggedIn(false)}
              >
                <Icon name="LogOut" size={20} />
              </Button>
            </div>
            
            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={18} />
              <Input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              />
            </div>
          </div>

          <CardContent className="p-0">
            <Tabs defaultValue="contacts" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-transparent h-14">
                <TabsTrigger value="contacts" className="text-lg data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
                  <Icon name="Users" size={20} className="mr-2" />
                  Контакты
                </TabsTrigger>
                <TabsTrigger value="groups" className="text-lg data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
                  <Icon name="UsersRound" size={20} className="mr-2" />
                  Группы
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="m-0">
                <div className="divide-y">
                  {filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      У вас пока нет контактов
                    </div>
                  ) : (
                    filteredContacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        onClick={() => openChat('contact', contact)}
                        className="p-4 hover:bg-purple-50 cursor-pointer transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {contact.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                              <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{contact.time}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                              {contact.unread && (
                                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  {contact.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="groups" className="m-0">
                <div className="divide-y">
                  {filteredGroups.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      У вас пока нет групп
                    </div>
                  ) : (
                    filteredGroups.map((group, index) => (
                      <div
                        key={group.id}
                        onClick={() => openChat('group', group)}
                        className="p-4 hover:bg-purple-50 cursor-pointer transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white">
                              <Icon name="Users" size={24} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                                <p className="text-xs text-muted-foreground">{group.members} участников</p>
                              </div>
                              <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{group.time}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-muted-foreground truncate">{group.lastMessage}</p>
                              {group.unread && (
                                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  {group.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

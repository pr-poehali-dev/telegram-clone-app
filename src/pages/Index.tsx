import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const contacts: Contact[] = [
    { id: 1, name: 'Анна Смирнова', lastMessage: 'Привет! Как дела?', time: '14:32', unread: 2, online: true },
    { id: 2, name: 'Дмитрий Петров', lastMessage: 'Отправил файлы', time: '13:15', online: true },
    { id: 3, name: 'Елена Кузнецова', lastMessage: 'Спасибо за помощь!', time: '12:48', unread: 1 },
    { id: 4, name: 'Сергей Иванов', lastMessage: 'До встречи завтра', time: '11:20' },
    { id: 5, name: 'Мария Волкова', lastMessage: 'Посмотри эту ссылку', time: 'Вчера', online: true },
  ];

  const groups: Group[] = [
    { id: 1, name: 'Рабочая группа', members: 24, lastMessage: 'Алексей: Встреча в 15:00', time: '15:10', unread: 5 },
    { id: 2, name: 'Друзья', members: 12, lastMessage: 'Наташа: 😄', time: '14:45', unread: 3 },
    { id: 3, name: 'Проект Alpha', members: 8, lastMessage: 'Ты: Готово!', time: '13:30' },
    { id: 4, name: 'Семья', members: 5, lastMessage: 'Мама: Позвони вечером', time: 'Вчера', unread: 1 },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
    }
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
              <p className="text-muted-foreground mt-2">Войдите для начала общения</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Введите ваше имя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-center text-lg h-12 border-2 focus:border-purple-500"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
              >
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
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
                    {username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{username}</h2>
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
                  {filteredContacts.map((contact, index) => (
                    <div
                      key={contact.id}
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
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="groups" className="m-0">
                <div className="divide-y">
                  {filteredGroups.map((group, index) => (
                    <div
                      key={group.id}
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
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

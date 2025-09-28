import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Static login credentials
    if (username === 'user' && password === 'pass') {
      const token = 'static-auth-token'; // You can generate a more secure token if needed
      sessionStorage.setItem('authToken', token);
      localStorage.setItem('loginData', JSON.stringify({ username }));
      navigate('/home/budget-tracker');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-[350px] bg-gray-800 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl">Login to ExpenseGrid</CardTitle>
          <CardDescription className="text-gray-400">Enter your credentials to access your budget and credit card tracker.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
            <CardFooter className="flex justify-end mt-4 p-0">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                Sign In
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
import React, { useState } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/SignupTemp';
import ChatHomeApp from './pages/Chat/ChatHomeApp'; 
import RefreshHandler from './refreshHandler';

function App() {
  const [isAuthenticated, setisAuthenticated] = useState(false);


  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <RefreshHandler setisAuthenticated={setisAuthenticated} />
      
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path='/login' element={<Login setisAuthenticated={setisAuthenticated} />} />
        
        <Route path='/signup' element={<Signup />} />
        
        <Route path='/home' element={<PrivateRoute element={<ChatHomeApp />} />} />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
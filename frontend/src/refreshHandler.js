import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function RefreshHandler({setisAuthenticated}) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(()=>{
        const token = localStorage.getItem('token');
        if(token){
            setisAuthenticated(true);
            if(location.pathname === '/' ||
                location.pathname === '/login' ||
                location.pathname === '/signup'
            ){
                navigate('/home',{replace : false})
            }
        } else {
            setisAuthenticated(false);
        }
    },[location, navigate, setisAuthenticated])
    return (
    null
  )
}

export default RefreshHandler

import React, {useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {ToastContainer} from 'react-toastify'
import { handleError, handleSuccess } from '../utils';

function Signup() {
  const [SignupInfo, setSignupInfo] = useState({
    name: '',
    email : '',
    password : ''
  })

  const navigate = useNavigate();
  const handleChange = (e)=>{
    const {name,value} = e.target;
    console.log(name, value);
    const copySignupInfo =  {...SignupInfo};
    copySignupInfo[name] = value;
    setSignupInfo(copySignupInfo);
  }

  const handleSignUp =async(e) =>{
    e.preventDefault();

    const {name, email, password} =  SignupInfo;

    if(!name ||!email ||!password){
      return handleError('name, email, password all are required');
    }
    try{
      const url = `${process.env.REACT_APP_API_URL}/auth/signup`
      const response = await fetch(url,{
        method : "POST",
        headers: {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify(SignupInfo)
      });

      const result = await response.json()
      const {success, message, jwtToken,name: UserName, error} = result;

      if(success){
        handleSuccess(message);

        localStorage.setItem('token',jwtToken);
        localStorage.setItem('loggedInUser',UserName);

        setTimeout(() => {
          navigate('/home')  
        }, 1000);

      }else if(error){
        const details = error?.details[0].message;
        handleError(details);
      }else if (!success){
        handleError(message);
      }

      console.log(result)
    }
    catch (err){
      handleError()
    }
  }

  return (
    <div className='container'>
      <h1>Signup</h1>
      <form onSubmit={handleSignUp}>
        <div>
          <label htmlFor='name'>Name</label>
          <input 
            onChange = {handleChange}
            type='text'
            name = 'name'
            value = {SignupInfo.name}
            autoFocus
            placeholder='Enter Your Name' />
        </div>
        <div>
          <label htmlFor='email'>Email</label>
          <input 
            onChange = {handleChange}
            type='email'
            name = 'email'
            value = {SignupInfo.email}

            placeholder='Enter Your Email' />
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input 
            onChange = {handleChange}
            type='password'
            name = 'password'
            value = {SignupInfo.password}

            placeholder='Enter Your Password' />
        </div>
        <button type='submit'>Signup</button>
        <span>Already Have an Account ?
          <Link to='/login'>Login</Link>
        </span>
      </form>
      <ToastContainer/>
    </div>
  )
}

export default Signup

import React from "react";
import Tilt from 'react-parallax-tilt'
import './Logo.css'
import favicon from './favicon.png'

const Logo = () => {
    return (
        <div className="ma4 mt0" >
            <Tilt className="Tilt br2 shadow-2 "  options={{max: 55}} style={{height: 150, width:150}}>
              <div className="Tilt-inner pa3" ><img alt='logo' style={{paddingTop:'5px', height:'100px'}}src={favicon}></img></div>
            </Tilt>
        </div>
    )
  }
  
  export default Logo
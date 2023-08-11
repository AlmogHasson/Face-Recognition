import React from 'react';
import './FaceRecognition.css'

const FaceRecognition = ({ imgURL, box }) => {
  const Square = (box) => {
     return box.map((square,i ) => {
      return (
        <div key={i}
         className='bounding-box'
         style={{ top: square.topRow, right: square.rightCol, bottom: square.bottomRow, left: square.leftCol }}>
         </div> 
      )
    })
  }


  return (
    <div className='center ma'>
      <div className="absolute mt2" >
        <img id='inputimage' src={imgURL} width='500px' height='auto' alt="" />
        {Square(box)}
      </div>
      <div className="absolute mt2">
      </div>
    </div>
  )

}

export default FaceRecognition;
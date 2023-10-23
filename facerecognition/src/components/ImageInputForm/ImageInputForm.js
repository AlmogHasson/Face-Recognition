import React from "react";
import './ImageInputForm.css'

const ImageInputForm = ({onInputChange, onImgSubmit, box }) => {

  return (
    <div >
      <p className="f3 white">
        {'This Magic Brain will detect faces in your pictures. Give it a try and make sure to use https addresses only!'}
      </p>
      <div className="white f3">
      {box.length ? <p>{`${box.length} Faces detected in the current entry! `}</p> : <p> No Faces Detected</p>}
      </div>
      <div className="center">
        <div className="form center pa4 br3 shadow-5">
          <input className="f4 pa2 w-70 center pointer" type="text" 
           onChange={onInputChange}/>
          <button className="w-30 grow f4 link ph3 pv2 dib white bg-light-purple"
           onClick={onImgSubmit}>Detect</button>
        </div>
      </div>
    </div>
  )
}

export default ImageInputForm
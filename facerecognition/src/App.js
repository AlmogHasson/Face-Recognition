import './App.css';
import 'tachyons'
import Rank from './components/Rank';
import Logo from './components/Logo/Logo';
import Navigation from './components/Navigation/Navigation';
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import ImageInputForm from './components/ImageInputForm/ImageInputForm';
import { Component } from 'react';
import Signin from './components/signIn/Signin';
import Register from './components/Register/Register';
import ParticlesBackground from './components/ParticlesBackground';
import { getJWT } from './common/get-jwt';
import { decodeAndStoreJWT } from './common/decode-jwt';
import { JWT_STORAGE_KEY } from './common/consts';

class App extends Component {

  constructor() {
    super();
    this.state = {
      input: '',
      imgURL: '',
      box: [],
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      },
      Bearer: '',
    }
  }
  refreshIntervalRef

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })
  }

  setBearer = (token) => {
    this.setState({ Bearer: token })
  }

  onInputChange = (e) => {
    this.setState({ input: e.target.value });
  }

  calculteFaceArea = (data) => {
    const faces = data.outputs[0].data.regions
    return faces.map((face, i) => {
      const clarifaiFace = face.region_info.bounding_box
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
      }
    })
  }

  displayFaceBox = (box) => {
    this.setState({ box: box })
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      clearInterval(this.refreshIntervalRef)
      window.localStorage.removeItem(JWT_STORAGE_KEY);
      this.setState({ isSignedIn: false });

      fetch('https://face-recognition-api-n3yg.onrender.com/signout', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.state.user.id
        })
      })
        .catch(err => { console.log(err) })
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route: route })
  }

  runInterval = () => {
    let jwt = getJWT()
    let expDate = jwt.exp

    this.refreshIntervalRef = setInterval(() => {
      let refreshedJwt = getJWT()
      expDate = refreshedJwt.exp

      fetch('https://face-recognition-api-n3yg.onrender.com/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      })
        .then(res => res.json())
        .then(res => {
          if (res.accessToken) {
            decodeAndStoreJWT(res.accessToken)
          }
        }
        )
        .catch((e) => {
          console.log(e);
          clearInterval(this.refreshIntervalRef);
          console.log("interval cleared")
        })
    }, expDate * 1000 - Date.now())
  }

  componentWillUnmount() {
    console.log("componentWillUnmount and clearInteval")
    clearInterval(this.refreshIntervalRef)
  }

  onImgSubmit = () => {
    this.setState({ imgURL: this.state.input });
    const MODEL_ID = 'face-detection';
    const USER_ID = 'clarifai';
    const APP_ID = 'main';
    const PAT = '1645566095c247389a70eac167b2c99b';


    const raw = JSON.stringify({
      "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID,

      },
      "inputs": [
        {
          "data": {
            "image": {
              "url": this.state.input
            }
          }
        }
      ]
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT,
      },
      body: raw
    };

    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/outputs", requestOptions)
      .then(response => response.json())
      .then(result => {
        if (result) {
          fetch('https://face-recognition-api-n3yg.onrender.com/image', {
            method: 'PUT',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${this.state.Bearer}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count =>
              this.setState(Object.assign(this.state.user, { entries: count }))
            )
        }
        this.displayFaceBox(this.calculteFaceArea(result))
      })
      .catch(error => console.log('error', error))
      .then(this.setState({ box: [] }))
  }

  render() {
    const { isSignedIn, route, imgURL, box } = this.state;

    return (
      <div className="App">
        <ParticlesBackground />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        {route === 'home'
          ? <div >
            <Logo />
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries} />
            <ImageInputForm
              box={box}
              onInputChange={this.onInputChange}
              onImgSubmit={this.onImgSubmit} />
            <FaceRecognition box={box} imgURL={imgURL} />
          </div>
          : (
            route === 'register'
              ? <Register
                loadUser={this.loadUser}
                onRouteChange={this.onRouteChange}
              />
              : <Signin
                runInterval={this.runInterval}
                loadUser={this.loadUser}
                onRouteChange={this.onRouteChange}
                setBearer={this.setBearer}
              />
          )
        }
      </div>
    );
  }
}

export default App;

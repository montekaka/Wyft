import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import GuestDashboard from './components/GuestDash.jsx';
import HostDashboard from './components/HostDash.jsx';
import HostDashAddHost from './components/HostDashAddHost.jsx';
import HostInfoDetail from './components/HostInfoDetail.jsx';
import SessionsAdd from './components/SessionsAdd.jsx';
import Login from './components/Login.jsx';
import Navigation from './components/Navigation.jsx';
// import COMPONENT from './components/COMPONENTNAME.jsx';
// import COMPONENT from './components/COMPONENTNAME.jsx';
import { Container, Segment } from 'semantic-ui-react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // how do we set state with
      // hosts
      // guests

      // default is Guest, so `state` starts off as a zipCode input from the Guest zip code search
      guest: true,
      zipcode: '',
      availableHosts: [],
      hosts: ''
    };

    this.searchZipCodes = this.searchZipCodes.bind(this);
    this.selectHostDash = this.selectHostDash.bind(this);
    this.addHost = this.addHost.bind(this);
    this.getHosts = this.getHosts.bind(this);
  }

  searchZipCodes(zipCode, cb) {
    // ajax POST
    // takes in a string

    // guest puts their zip code in the input, clicks 'search' button

    // returns a list of hosts with the same zip code

    $.ajax({
      type: 'POST',
      url: '/api/guests/search',
      data: JSON.stringify({ data: zipCode }),
      contentType: 'application/json',

      success: function(data) {
        //console.log('🌸 client/src/index.jsx');
        cb(data);
        // on success
        // returns a list of hosts with matching zip codes
      },

      error: function(err) {
        console.log('🤮 client/src/index.jsx');
        // potentional error, no matching zipcodes?

        // returns a notification along the lines of
        // "Either we messed up or you have a very lonely zip code. Regardless, we're sorry!"
      }
    });
  }

  selectHostDash() {
    // button to select the Host Dashboard
  }

  addHost(data, callback) {
    // ajax POST

    // takes four strings
    // availability
    // zip code (DOES THIS BEING A NUMBER MAKE SEARCH EASIER)
    // contact info
    // optional gift

    // a successful post results in a notification in brower window
    // ex. "Thank you for hosting!"

    $.ajax({
      type: 'POST',
      url: '/api/hosts',
      data: JSON.stringify({ data: data }),
      contentType: 'application/json',
      success: function(data) {
        console.log(data);
        callback();
      },
      error: function(err) {}
    });
  }

  getHosts() {
    $.get('/api/hosts', data => {
      this.setState({ hosts: data });
    });
  }



  render() {
    // default is Guest dashboard
    // Guest MVP is a page with an input with a `search` button
    // includes a button to switch to 'Host' dashboard
    // Host MVP is a page with four inputs (availability, zip code, contact info, optional gift) and a `submit` button
    // includes a button to switch to 'Guest' dashboard
    return (
      <Container>
        <Router >
          <div>
            <Navigation getHosts={this.getHosts} />
            <div className="wrapper">
              <h1 className="ui huge header">Wyft</h1>
              <h4>Like CouchSurfing, but for WiFi.</h4>
              <Switch>
                <Route
                  exact
                  path="/"
                  render={props => (
                    <GuestDashboard searchZip={this.searchZipCodes} />
                  )}
                />
                <Route
                  exact
                  path="/hosts"
                  render={props => <HostDashboard data={this.state.hosts} />}
                />
                <Route
                  exact
                  path="/host/new"
                  render={props => <HostDashAddHost addHost={this.addHost} />}
                />
                <Route
                  exact
                  path="/hosts/:host_id"
                  render={props => {
                    let hostPosition = props.match.params.host_id;
                    return <HostInfoDetail hostId={hostPosition} />;
                  }}
                />
                <Route exact path="/hosts/:host_id/sessions/new" render={(props) => {
                  //let hostPosition = props.location.pathname.replace('/hosts/','');
                  let hostPosition = props.match.params.host_id;
                  return (
                    <SessionsAdd hostId={hostPosition}/>
                  )
                }}/>
                <Route
                  exact
                  path="/login"
                  render={props => <Login />}
                />
              </Switch>
            </div>
          </div>
        </Router>
      </Container>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));

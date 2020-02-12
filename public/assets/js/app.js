/* global document window fetch Common firebase */
/* eslint-disable no-unused-expressions */
window.App || (
  window.Common && (() => {
    class App extends Common {
      constructor() {
        super();
        const apiKey = 'BDCduUmCdNdkNov_rwvGTDLC7ez8fmREbdx4rS205xN4-wI9WMvhQ72o2HfkXZUbXWTDZRsA68qEV1aBa8dLuC0';
        const config = {
          apiKey: 'AIzaSyAlGETt2oe_9zfGwuzdvKzNK9pdqrQqwgA',
          authDomain: 'notification-aaa.firebaseapp.com',
          databaseURL: 'https://notification-aaa.firebaseio.com',
          projectId: 'notification-aaa',
          storageBucket: 'notification-aaa.appspot.com',
          messagingSenderId: '592002215665',
        };
        firebase.initializeApp(config);
        this.messaging = firebase.messaging();
        this.messaging.usePublicVapidKey(apiKey);
        this.swEvent();
        this.checkToken();
        this.interval();
      }
      swEvent() {
        this.messaging.onTokenRefresh(() => {
          this.messaging.getToken().then((refreshedToken) => {
            this.logger.log('Token refreshed.');
            this.setTokenSentToServer(false);
            this.sendTokenToServer(refreshedToken);
            this.checkToken();
          }).catch(err => {
            this.logger.log('Unable to retrieve refreshed token ', err);
          });
        });
        this.messaging.onMessage(payload => {
          this.logger.log('Message received. ', payload);
        });
      }
      checkToken() {
        this.messaging.getToken().then(currentToken => {
          if (currentToken) {
            this.sendTokenToServer(currentToken);
          } else {
            this.logger.log('No Instance ID token available. Request permission to generate one.');
            this.requestPermission();
            this.setTokenSentToServer(false);
          }
        }).catch(err => {
          this.logger.log('An error occurred while retrieving token. ', err);
          this.setTokenSentToServer(false);
        });
      }
      sendTokenToServer(currentToken) {
        if (!this.isTokenSentToServer()) {
          this.logger.log(`Sending token to server... ${currentToken}`);
          // TODO(developer): Send the current token to your server.
          this.setTokenSentToServer(true);
        } else {
          this.logger.log(
            'Token already sent to server so won\'t send it again unless it changes',
          );
        }
      }
      requestPermission() {
        this.logger.log('Requesting permission...');
        this.messaging.requestPermission().then(() => {
          this.logger.log('Notification permission granted.');
        }).catch(err => {
          this.logger.log('Unable to get permission to notify.', err);
        });
      }
      deleteToken() {
        this.messaging.getToken().then(currentToken => {
          this.messaging.deleteToken(currentToken).then(() => {
            this.logger.log('Token deleted.');
            this.setTokenSentToServer(false);
            this.checkToken();
          }).catch(err => {
            this.logger.log('Unable to delete token. ', err);
          });
        }).catch(err => {
          this.logger.log('Error retrieving Instance ID token. ', err);
        });
      }
      isTokenSentToServer() {
        return window.localStorage.getItem('sentToServer') === '1';
      }
      setTokenSentToServer(sent) {
        window.localStorage.setItem('sentToServer', sent ? '1' : '0');
      }
      date() {
        fetch(`${this.url.date}?v=${new Date().getTime()}`, { method: 'get' })
        .then(res => res.headers.get('date'))
        .then(gmt => new Date(gmt).toLocaleString())
        .then(res => ({ html: res, element: document.querySelector('#date') || {} }))
        .catch(e => e.message)
        .then(obj => (o => o)(obj).element.innerHTML = obj.html);
      }
      interval() {
        this.url = {
          date: '/robots.txt',
        };
        setTimeout(() => this.setInterval(), 2200);
      }
      setInterval() {
        setInterval(() => this.date(), 1000);
      }
    }
    window.App = App;
    return new App();
  })()
) || (() => { throw new Error('bad'); })();

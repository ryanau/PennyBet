var React = require('react');
var $ = require('jquery');
var Router = require('react-router');
var Link = Router.Link;
var moment = require('moment');
var Users = require('../users.js');
var TransactionsContainer = require('./TransactionsContainer.jsx');
var SearchModal = require('./SearchModal.jsx');
var TransactionModal = require('./TransactionModal.jsx');
var PendingTransaction = require('./PendingTransaction.jsx');


var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var FlatButton = mui.FlatButton;
var Dialog = mui.Dialog;
var TextField = mui.TextField;
var Card = mui.Card;
var CardHeader = mui.CardHeader;
var CardText = mui.CardText;
var CardActions = mui.CardActions;
var CardTitle = mui.CardTitle;
var Avatar = mui.Avatar;
var Snackbar = mui.Snackbar;

BetContainer = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },
  getChildContext: function () {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  getInitialState: function () {
    return {
      usersBasket: new Users,
      pending: false,
    }
  },
  componentDidMount: function(){
    this.state.usersBasket.on('change', this.usersChanged);
    this.loadPendingTransaction();
  },
  componentWillUnmount: function(){
    this.state.usersBasket.off('change');
  },
  usersChanged: function(){
    this.forceUpdate();
  },
  newTransaction: function () {
    var data = {
      bet_id: this.props.bet.id,
      users: this.state.usersBasket.users
    };
    var i = 0
    var losers = 0
    var winners = 0
    this.state.usersBasket.users.forEach(function(user) {
      if (user.winner) {
        winners += 1
      } else {
        losers += 1
      };
    });
    if (losers == this.state.usersBasket.users.length || winners == this.state.usersBasket.users.length) {
      alert('There has to be at least one loser or winner.')
    } else {
      $.ajax({
        url: this.props.origin + '/entries',
        type: 'POST',
        data: data,
        dataType: 'json',
        crossDomain: true,
        headers: {'Authorization': sessionStorage.getItem('jwt'),
        },
        success: function (data) {
          this.closeTransactionModal();
          this.refs.newTransactionNotification.show();
          this.loadPendingTransaction();
        }.bind(this),
        error: function(error) {
          window.location = "/"
        }.bind(this),
      }); 
    }
  },
  loadPendingTransaction: function () {
    var data = {
      bet_id: this.props.bet.id
    };
    $.ajax({
      url: this.props.origin + '/pending',
      type: 'GET',
      data: data,
      dataType: 'json',
      crossDomain: true,
      headers: {'Authorization': sessionStorage.getItem('jwt'),
      },
      success: function (data) {
        this.setState({
          pending: data.pending,
        })
      }.bind(this),
      error: function(error) {
        window.location = "/"
      }.bind(this),
    }); 
  },
  handleAddUser: function (user_id) {
    var data = {
      bet_id: this.props.bet.id,
      user_id: user_id,
    };
    $.ajax({
      url: this.props.origin + '/add_user',
      type: 'POST',
      data: data,
      dataType: 'json',
      crossDomain: true,
      headers: {'Authorization': sessionStorage.getItem('jwt'),
      },
      success: function (data) {
        this.closeAddUserModal();
        this.refs.newUserNotification.show();
        this.props.refresh();
      }.bind(this),
      error: function(error) {
        window.location = "/"
      }.bind(this),
    });
  },
  openTransactionModal: function () {
    this.refs.newTransactionDialog.show();
  },
  closeTransactionModal: function () {
    this.refs.newTransactionDialog.dismiss();
    this.state.usersBasket.empty();
  },
  openAddUserModal: function () {
    this.refs.newAddUserDialog.show();
  },
  closeAddUserModal: function () {
    this.refs.newAddUserDialog.dismiss();
  },
  handleDeleteBetConfirmation: function () {
    if (confirm("Are You Sure to Delete Bet?") == true) {
      this.handleDeleteBet();
    };
  },
  handleDeleteBet: function () {
    var data = {
      bet_id: this.props.bet.id,
    }
    $.ajax({
      url: this.props.origin + '/bets/' + this.props.bet.id,
      type: 'DELETE',
      data: data,
      dataType: 'json',
      crossDomain: true,
      headers: {'Authorization': sessionStorage.getItem('jwt'),
      },
      success: function (data) {
        this.props.refresh();
      }.bind(this),
      error: function(error) {
        window.location = "/"
      }.bind(this),
    });
  },
  render: function () {
    var bet = this.props.bet
    var TransactionDialogAction = [
      <div>
      <FlatButton
        label="Cancel"
        onClick={this.closeTransactionModal}/>
      <FlatButton
        label="Create Transaction"
        onClick={this.newTransaction}/> 
      </div>
    ];
    var AddUserDialogAction = [
      <div>
      <FlatButton
        label="Cancel"
        onClick={this.closeAddUserModal}/>
      </div>
    ];
    var transactionModal = 
    <Dialog
      ref="newTransactionDialog"
      title="New Transaction"
      actions={TransactionDialogAction}
      modal={false}>
      <TransactionModal bet_id={bet.id} origin={this.props.origin} users={bet.users} usersBasket={this.state.usersBasket}/>
    </Dialog>
    var addUserModal = 
    <Dialog
      ref="newAddUserDialog"
      title={bet.name}
      actions={AddUserDialogAction}
      modal={false}>
      <SearchModal origin={this.props.origin} addUser={this.handleAddUser} users={bet.users}/>
    </Dialog>
    var transactions = bet.entries.map(function (entry, index) {
      return (
        <TransactionsContainer origin={this.props.origin} key={entry.id} entry={entry} currentUser={this.props.currentUser}/>
      );
    }.bind(this));
    var avatars = bet.users.map(function (user, index) {
      if (user.pic == "https://s3.amazonaws.com/venmo/no-image.gif" || user.pic.substring(0,27) == "https://graph.facebook.com/") {
        return (
          <Avatar>{user.first_name.charAt(0) + user.last_name.charAt(0)}</Avatar>
        )
      } else {
        return (
          <Avatar src={user.pic} key={index} />
        )
      };
    }.bind(this))
    if (this.state.pending === "true") {
      var showButtons = 
      <FlatButton
        label="Approve"/>
    } else if (this.state.pending === "approved") {
      var showButtons = 
      <FlatButton
        label="Waiting for others to confirm"
        disabled={true}/>
    } else {
      var showButtons = 
        <div>
        <FlatButton
          label="Add User to Bet"
          onClick={this.openAddUserModal}/>
        <FlatButton
            label="New Transaction"
            onClick={this.openTransactionModal}/>
        </div>;
    };
    var permanentButtons = 
      <div>
        <FlatButton
          label="Delete Bet"
          onClick={this.handleDeleteBetConfirmation}/>
      </div>
    var subInfo = moment(bet.created_at).fromNow();
    return (
    	<div>
        {addUserModal}
        {transactionModal}
        <Snackbar
          ref="newUserNotification"
          message='User Added'
          autoHideDuration={2000}/>
        <Snackbar
          ref="newTransactionNotification"
          message='Transaction Created'
          autoHideDuration={2000}/>
	      <Card key={bet.id} initiallyExpanded={false}>
          <CardHeader
          title={bet.name}
          subtitle={subInfo}
          avatar={<Avatar>{bet.name.charAt(0)}</Avatar>}
          showExpandableButton={true} />
          <CardText>
            {avatars}
            <span />
            {showButtons}
            {permanentButtons}
          </CardText>
          <CardText expandable={true}>
          {transactions}
          </CardText>
          <CardActions expandable={true}></CardActions>
        </Card>
      </div>
    );
  }
});

module.exports = BetContainer;

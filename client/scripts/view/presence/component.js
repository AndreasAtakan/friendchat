/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

'use strict';

var library = window.library || {};
var friendUP = window.friendUP || {};
var hello = window.hello || {};

// UserGroup
(function( ns, undefined ) {
    ns.UserGroup = function(
        conf,
        containerId,
        userSource,
        templateManager
    ) {
        const self = this;
        self.clientId = conf.clientId;
        self.type = conf.clientId;
        self.name = conf.name;
        self.usersId = conf.clientId + '-users';
        self.sectionKlass = conf.sectionKlass;
        self.containerId = containerId;
        self.userSource = userSource;
        self.template = templateManager;
        
        self.items = {};
        self.itemList = [];
        
        self.el = null;
        
        self.init();
    }
    
    // Public
    
    ns.UserGroup.prototype.setList = function( idList ) {
        const self = this;
        console.log( 'UserGroup.setList - NYI', idList );
    }
    
    ns.UserGroup.prototype.attach = function( id ) {
        const self = this;
        const item = self.userSource[ id ];
        if ( !item ) {
            console.log( 'UserGroup.attach - no item for id', {
                id : id,
                items : self.userSource,
            });
            return false;
        }
        
        item.group = self.type;
        if ( self.items[ id ])
            return;
        
        self.items[ id ] = item;
        self.itemList.push( id );
        self.sort( id );
        self.reorder( id );
        self.updateVisible();
        return item;
    }
    
    ns.UserGroup.prototype.detach = function( id ) {
        const self = this;
        const item = self.items[ id ];
        if ( !item ) {
            console.log( 'UserGroup.attach - no item for id', {
                id : id,
                items : self.items,
            });
            return null;
        }
        
        item.group = null;
        delete self.items[ id ];
        self.itemList = self.itemList.filter( notId );
        self.updateVisible();
        return item;
        
        function notId( itemId ) {
            return itemId !== id;
        }
    }
    
    ns.UserGroup.prototype.remove = function( id ) {
        const self = this;
        const item = self.detach( id );
        if ( !item || !item.el )
            return false;
        
        const el = item.el;
        el.parentNode.removeChild( el );
        return item;
    }
    
    ns.UserGroup.prototype.close = function() {
        const self = this;
        
        if ( self.el )
            self.el.parentNode.removeChild( self.el );
        
        delete self.el;
        delete self.userSource;
        delete self.template;
        delete self.items;
        delete self.itemList;
    }
    
    // Private
    
    ns.UserGroup.prototype.init =  function() {
        const self = this;
        const elConf = {
            clientId     : self.clientId,
            name         : self.name,
            sectionKlass : self.sectionKlass,
            usersId      : self.usersId,
        };
        self.el = self.template.getElement( 'user-group-tmpl', elConf );
        const container = document.getElementById( self.containerId );
        if ( !container )
            throw new Error( 'UserGroup.init - invalid container id: ' + self.containerId );
        
        container.appendChild( self.el );
        self.usersEl = document.getElementById( self.usersId );
        self.updateVisible();
    }
    
    ns.UserGroup.prototype.updateVisible = function() {
        const self = this;
        const hasItems = !!self.itemList.length;
        self.el.classList.toggle( 'hidden', !hasItems );
    }
    
    ns.UserGroup.prototype.sort = function( id ) {
        const self = this;
        self.itemList.sort( byName );
        function byName( idA, idB ) {
            let a = self.items[ idA ];
            let b = self.items[ idB ];

            if ( a.name === b.name )
                return 0;
            
            let ni = 0; // name character index
            let res = 0;
            do {
                res = compare( a, b, ni );
                ni++;
            } while ( res === 0 );
            
            return res;
            
            function compare( a, b, ni ) {
                let aN = a.name[ ni ];
                let bN = b.name[ ni ];
                if ( aN === bN )
                    return 0;
                
                if ( aN < bN )
                    return -1;
                else
                    return 1;
            }
        }
    }
    
    ns.UserGroup.prototype.reorder = function( id ) {
        const self = this;
        if ( id )
            reorderItem( id );
        else
            applyListOrder();
        
        function reorderItem( id ){
            const item = self.items[ id ];
            if ( !item || !item.el )
                return;
            
            const index = self.itemList.indexOf( id );
            if ( -1 === index ) {
                throw new Error( 'did you forget to add the id to the itemList?' );
            }
            
            if (( index + 1 ) === self.itemList.length ) {
                // id is last item in the list
                self.usersEl.appendChild( item.el );
                return;
            }
            
            const beforeIndex = index + 1; // before is the item we will insert before
            const beforeId = self.itemList[ beforeIndex ];
            const beforeItem = self.items[ beforeId ];
            const beforeEl = beforeItem.el || null; // better safe than sorry
            self.usersEl.insertBefore( item.el, beforeEl );
        }
        
        function applyListOrder() {
            self.itemList.forEach( append );
            function append( id ) {
                const item = self.items[ id ];
                if ( !item || item.el )
                    return;
                
                self.usersEl.appendChild( item.el );
            }
        }
    }
    
})( library.component );


// GroupUser
(function( ns, undefined ) {
    ns.GroupUser = function(
        id,
        conn,
        conf,
        tmplManager
    ) {
        const self = this;
        self.id = id;
        self.conn = conn;
        self.name = conf.name;
        self.avatar = conf.avatar;
        self.isAdmin = conf.isAdmin || false;
        self.isAuthed = conf.isAuthed || false;
        self.isGuest = conf.isGuest || false;
        self.workgroups = conf.workgroups;
        self.state = conf.state || '';
        self.template = tmplManager;
        
        self.el = null;
        self.group = null;
        self.states = {};
        
        self.init();
    }
    
    // Public
    
    ns.GroupUser.prototype.updateName = function( name ) {
        const self = this;
        self.name = name;
        const nameEl = self.el.querySelector( '.name' );
        nameEl.textContent = name;
    }
    
    // add defaults to true
    ns.GroupUser.prototype.setState = function( type, add ) {
        const self = this;
        if ( !type || !type.length || !isValid( type ))
            return;
        
        if ( null == add )
            add = true;
        
        if ( add )
            self.states[ type ] = type;
        else
            delete self.states[ type ];
        
        let topState = null;
        self.stateOrder.some( setTopState );
        let stateKlass = self.stateKlasses[ topState ] || '';
        self.stateEl.className = 'fa fa-fw ' + stateKlass;
        
        function setTopState( state ) {
            if ( !self.states[ state ])
                return false;
            
            topState = state;
            return true;
        }
        
        function isValid( type ) {
            return -1 !== self.stateOrder.indexOf( type );
        }
    }
    
    ns.GroupUser.prototype.close = function() {
        const self = this;
        delete self.id;
        delete self.conn;
        delete self.template;
        delete self.group;
        delete self.el;
    }
    
    // Private
    
    ns.GroupUser.prototype.stateKlasses = {
        'typing' : 'fa-keyboard-o',
        'live'   : 'fa-video-camera',
    }
    
    ns.GroupUser.prototype.stateOrder = [
        'typing',
        'live',
    ];
    
    ns.GroupUser.prototype.init = function() {
        const self = this;
        self.el = buildElement();
        bindElement();
        if ( self.state )
            self.setState( self.state );
        
        delete self.state;
        
        function buildElement() {
            const conf = {
                id     : self.id,
                name   : self.name,
            };
            const el = self.template.getElement( 'user-list-item-tmpl', conf );
            return el;
        }

        function bindElement() {
            self.stateEl = self.el.querySelector( '.state > i' );
            if ( self.isGuest )
                return;
            
            self.el.addEventListener( 'click', userClick, false );
            
            function userClick( e ) { self.handleClick(); }
        }
    }
    
    ns.GroupUser.prototype.handleClick = function() {
        const self = this;
        self.conn.send({
            type : 'contact-open',
            data : self.id,
        });
    }
    
})( library.component );

// UserCtrl
(function( ns, undefined ) {
    ns.UserCtrl = function(
        conn,
        users,
        onlineList,
        workgroups,
        guestAvatar,
        containerId,
        templateManager
    ) {
        const self = this;
        library.component.EventEmitter.call( self );

        self.conn = conn;
        self.users = {};
        self.userIds = [];
        self.onlines = onlineList;
        self.groups = {};
        self.groupIds = [];
        self.containerId = containerId;
        self.template = templateManager;
        
        self.init( workgroups, users, guestAvatar );
    }
    
    ns.UserCtrl.prototype = Object.create( library.component.EventEmitter.prototype );
    
    // Public
    
    ns.UserCtrl.prototype.get = function( userId ) {
        const self = this;
        return self.users[ userId ] || null;
    }
    
    ns.UserCtrl.prototype.getGroup = function( userId ) {
        const self = this;
        const user = self.users[ userId ];
        if ( !user )
            return null;
        
        return self.groups[ user.group ] || null;
    }
    
    ns.UserCtrl.prototype.checkIsOnline = function( userId ) {
        const self = this;
        return self.onlines.some( oId => oId === userId );
    }
    
    ns.UserCtrl.prototype.setState = function( userId, state, isSet ) {
        const self = this;
        const user = self.users[ userId ];
        if ( !user ) {
            console.log( 'UserCtrl.setState - no user for uid', {
                uid : userId,
                users : self.users,
            });
            return;
        }
        
        user.setState( state, isSet );
        self.emit( 'state', {
            state  : state,
            isSet  : isSet,
            userId : userId,
        });
    }
    
    ns.UserCtrl.prototype.addIdentities = function( idMap ) {
        const self = this;
        let ids = Object.keys( idMap );
        ids.forEach( addCss );
        function addCss( id ) {
            let identity = idMap[ id ];
            self.addUserCss( id, identity.avatar );
        }
    }
    
    ns.UserCtrl.prototype.updateAll = function( state ) {
        const self = this;
        removeOld( state.users );
        addNew( state.users );
        updateOnline( state.online );
        updateLive( state.peers );
        
        function removeOld( fresh ) {
            let current = Object.keys( self.users );
            let remove = current.filter( uid => {
                if ( null == fresh[ uid ] )
                    return true;
                else
                    return false;
            });
            
            remove.forEach( uid => self.handleLeave( uid ));
        }
        
        function addNew( fresh ) {
            let freshIds = Object.keys( fresh );
            let add = freshIds.filter( fid => {
                if ( null == self.users[ fid ])
                    return true;
                else
                    return false;
            });
            add.forEach( fid => self.handleJoin( fresh[ fid ]));
        }
        
        function updateOnline( fresh ) {
            let uids = Object.keys( self.users );
            uids.forEach( uid => {
                if ( fresh.some( fid => fid === uid ))
                    self.handleOnline( uid );
                else
                    self.handleOffline( uid );
            });
        }
        
        function updateLive( peers ) {
            let uids = Object.keys( self.users );
            uids.forEach( uid => {
                let isLive = false;
                if ( peers.some( pid => pid === uid ))
                    isLive = true;
                
                self.setState( uid, 'live', isLive );
            });
        }
    }
    
    ns.UserCtrl.prototype.getAvatarKlass = function( userId ) {
        const self = this;
        const user = self.users[ userId ];
        if ( user.isGuest )
            userId = 'guest-user';
        
        return self.getUserCssKlass( userId );
    }
    
    ns.UserCtrl.prototype.close = function() {
        const self = this;
        self.releaseConn();
        self.closeUsers();
        self.closeGroups();
        if ( self.el )
            self.el.parentNode.removeChild( self.el );
        
        delete self.detached;
        delete self.el;
        delete self.conn;
        delete self.users;
        delete self.userIds;
        delete self.onlines;
        delete self.groups;
        delete self.groupIds;
        delete self.available;
    }
    
    // Private
    
    ns.UserCtrl.prototype.init = function( workgroups, users, guestAvatar ) {
        const self = this;
        self.build();
        self.initBaseGroups();
        
        self.setWorkgroups( workgroups );
        
        if ( users ) {
            let uids = Object.keys( users );
            uids.forEach( uid => self.handleJoin( users[ uid ]));
        }
        
        self.addUserCss( 'guest-user', guestAvatar );
        self.addUserCss( 'default-user', guestAvatar );
        
        self.bindConn();
    }
    
    ns.UserCtrl.prototype.build = function() {
        const self = this;
        const container = document.getElementById( self.containerId );
        const conf = {};
        self.el = self.template.getElement( 'user-ctrl-tmpl', conf );
        container.appendChild( self.el );
        self.detached = document.getElementById( 'user-ctrl-detached' );
    }
    
    ns.UserCtrl.prototype.initBaseGroups = function() {
        const self = this;
        const base = [
            {
                clientId     : 'offline',
                name         : View.i18n( 'i18n_offline' ),
                sectionKlass : 'BackgroundHeavy',
            },
            {
                clientId     : 'admins',
                name         : View.i18n( 'i18n_admins' ),
                sectionKlass : 'Action',
            },
            {
                clientId     : 'online',
                name         : View.i18n( 'i18n_online' ),
                sectionKlass : 'Accept',
            },
            {
                clientId     : 'guests',
                name         : View.i18n( 'i18n_guests' ),
                sectionKlass : 'Warning',
            },
            {
                clientId     : 'bug',
                name         : View.i18n( 'i18n_bug' ),
                sectionKlass : 'Danger',
            },
        ];
        
        base.forEach( add );
        function add( groupConf ) {
            self.addWorkgroup( groupConf );
        }
    }
    
    ns.UserCtrl.prototype.setWorkgroups = function( conf ) {
        const self = this;
        if ( !conf || !conf.assigned )
            return;
        
        const ava = conf.available;
        const ass = conf.assigned;
        self.groupsAvailable = conf.ava;
        ass.forEach( worg => self.addWorkgroup( worg ));
    }
    
    ns.UserCtrl.prototype.addWorgAvailable = function( worg ) {
        const self = this;
        const wId = worg.clientId;
        self.groupsAvailable[ wId ] = worg;
    }
    
    ns.UserCtrl.prototype.addWorkgroup = function( worg ) {
        const self = this;
        if ( !worg || !worg.clientId )
            return;
        
        if ( self.groups[ worg.clientId ])
            return;
        
        if ( null == worg.sectionKlass )
            worg.sectionKlass = 'Available';
        
        let group = new library.component.UserGroup(
            worg,
            self.el.id,
            self.users,
            self.template,
        );
        self.groups[ group.clientId ] = group;
        self.groupIds.push( group.clientId );
        
        if ( 'offline' !== group.clientId )
            moveOfflineToBottom();
        
        function moveOfflineToBottom() {
            const offline = self.groups[ 'offline' ];
            if ( !offline )
                throw new Error( 'Hey fucko, you forgot to remove this part' );
            
            self.el.appendChild( offline.el );
        }
    }
    
    ns.UserCtrl.prototype.removeWorkgroup = function( worgId ) {
        const self = this;
        console.log( 'removeWorkgroup - NYI', worgId );
    }
    
    ns.UserCtrl.prototype.bindConn = function() {
        const self = this;
        if ( !self.conn ) {
            throw new Error( 'UserCtrl.bindConn - no conn' );
            return;
        }
        
        self.conn.on( 'online', online );
        self.conn.on( 'offline', offline );
        self.conn.on( 'join', join );
        self.conn.on( 'leave', leave );
        self.conn.on( 'identity', identity );
        self.conn.on( 'auth', auth );
        self.conn.on( 'workgroups-assigned', worgsAssigned );
        self.conn.on( 'workgroup-available', worgAvailable );
        
        function online( e ) { self.handleOnline( e ); }
        function offline( e ) { self.handleOffline( e ); }
        function join( e ) { self.handleJoin( e ); }
        function leave( e ) { self.handleLeave( e ); }
        function identity( e ) { self.handleIdentity( e ); }
        function auth( e ) { self.handleAuth( e ); }
        function worgsAssigned( e ) { self.handleWorgsAssigned( e ); }
        function worgAvailable( e ) { self.addWorgAvailable( e ); }
    }
    
    ns.UserCtrl.prototype.releaseConn = function() {
        const self = this;
        if ( !self.conn )
            return;
        
        self.conn.release( 'online' );
        self.conn.release( 'offline' );
        self.conn.release( 'join' );
        self.conn.release( 'leave' );
        self.conn.release( 'identity' );
        self.conn.release( 'auth' );
        self.conn.release( 'workgroup' );
    }
    
    ns.UserCtrl.prototype.closeUsers = function() {
        const self = this;
        console.log( 'closeUsers - NYI', self.users );
    }
    
    ns.UserCtrl.prototype.closeGroups = function() {
        const self = this;
        console.log( 'closeGroups - NYI', self.groups );
    }
    
    ns.UserCtrl.prototype.handleOnline = function( data ) {
        const self = this;
        const uid = data.clientId;
        const user = self.users[ uid ];
        if ( !user )
            return;
        
        if ( self.onlines.some( oid => oid === uid ))
            return;
        
        self.onlines.push( uid );
        user.isAdmin = data.isAdmin;
        user.isAuthed = data.isAuthed;
        user.workgroups = data.workgroups;
        self.setUserToGroup( uid );
    }
    
    ns.UserCtrl.prototype.handleOffline = function( userId ) {
        const self = this;
        let user = self.users[ userId ];
        if ( !user || !user.isAuthed ) {
            console.log( 'UserCtrl.handleOffline - \
            user not or not authed, so cannot be set offline', user );
            return;
        }
        
        self.onlines = self.onlines.filter( uid => userId !== uid );
        self.moveUserToGroup( userId, 'offline' );
    }
    
    ns.UserCtrl.prototype.handleJoin = function( user ) {
        const self = this;
        const uid = user.clientId;
        if ( null != self.users[ uid ] ) {
            console.log( 'UserCtrl.addUser - user already present ( hueuhueh )', {
                user  : user,
                users : self.users,
            });
            return;
        }
        
        const userItem = new library.component.GroupUser(
            uid,
            self.conn,
            user,
            self.template
        );
        self.users[ uid ] = userItem;
        self.addUserCss( userItem.id, userItem.avatar );
        
        self.setUserToGroup( uid );
    }
    
    ns.UserCtrl.prototype.setUserToGroup = function( userId ) {
        const self = this;
        const user = self.users[ userId ];
        if ( !user ) {
            console.log( 'setUSertoGroup - no user for', {
                uid : userId,
                users : self.users,
            });
            return;
        }
        
        let isOnline = checkOnline( userId );
        let groupId = null;
        if ( user.isAuthed ) {
            if ( isOnline )
                groupId = 'online';
            else
                groupId = 'offline';
        }
        
        if ( user.isAdmin && isOnline )
            groupId = 'admins';
        
        if ( user.isGuest )
            groupId = 'guests';
        
        if ( !groupId && user.workgroups ) {
            let available = user.workgroups.filter( wgId => !!self.groups[ wgId ]);
            groupId = available[ 0 ];
            if ( !self.groups[ groupId ]) {
                console.log( 'UserCtrl.handleJoin - no group for workgroup', {
                    u : user,
                    g : self.groups,
                });
                groupId = null;
            }
        }
        
        self.moveUserToGroup( user.id, groupId );
        
        function checkOnline( userId ) {
            const index = self.onlines.indexOf( userId );
            if ( -1 !== index )
                return true;
            else
                return false;
        }
    }
    
    ns.UserCtrl.prototype.handleLeave = function( userId ) {
        const self = this;
        const user = self.users[ userId ];
        if ( !user )
            return;
        
        self.removeFromGroup( userId );
        delete self.users[ userId ];
        user.close();
    }
    
    ns.UserCtrl.prototype.handleIdentity = function( id ) {
        const self = this;
        console.log( 'UserCtrl.handleIdentity - NYI', id );
    }
    
    ns.UserCtrl.prototype.handleAuth = function( event ) {
        const self = this;
        console.log( 'presence.handleAuth - NYI', event );
    }
    
    ns.UserCtrl.prototype.handleWorgsAssigned = function( wgs ) {
        const self = this;
        if ( !wgs || !wgs.forEach )
            return;
        
        wgs.forEach( add );
        function add( wg ) { self.addWorkgroup( wg ); }
    }
    
    ns.UserCtrl.prototype.moveUserToGroup = function( userId, groupId ) {
        const self = this;
        if ( !groupId )
            groupId = 'bug';
        
        const user = self.users[ userId ];
        if ( !user ) {
            console.log( 'UserCtrl.moveUserToGroup - no user for id', {
                uid   : userId,
                users : self.users,
            });
            return;
        }
        
        if ( user.group && ( user.group !== groupId ))
            detachFromGroup( user );
        
        const group = self.groups[ groupId ];
        if ( !group ) {
            console.log( 'UserCtrl.moveUserToGroup - invalid groupId', {
                type   : groupId,
                groups : self.groups,
            });
            return;
        }
        
        group.attach( user.id );
        
        function detachFromGroup( user ) {
            const detachGrp = self.groups[ user.group ];
            if ( !detachGrp )
                return;
            
            detachGrp.detach( user.id );
        }
    }
    
    ns.UserCtrl.prototype.removeFromGroup = function( userId ) {
        const self = this;
        const user = self.users[ userId ];
        if ( !user ) {
            console.log( 'UserCtrl.removeFromGroup - no user', {
                uid   : userId,
                users : Object.keys( self.users ),
            });
            return;
        }
        
        const group = self.groups[ user.group ];
        if ( !group ) {
            console.log( 'UserCtrl.removeFromGroup - no group for user', {
                user   : user,
                groups : Object.keys( self.groups ),
            });
            return;
        }
        
        group.remove( userId );
    }
    
    ns.UserCtrl.prototype.addUserCss = function( userId, avatar ) {
        const self = this;
        if ( !avatar )
            return;
        
        const container = document.getElementById( 'user-css' );
        const klassName = self.getUserCssKlass( userId );
        const cssConf = {
            clientId  : userId,
            klassName : klassName,
            avatar    : avatar,
        };
        const cssEl = friend.template.getElement( 'user-css-tmpl', cssConf );
        container.appendChild( cssEl );
    }
    
    ns.UserCtrl.prototype.getUserCssKlass = function( userId ) {
        const self = this;
        return userId + '-klass';
    }
    
})( library.component );


// MsgBuilder
(function( ns, undefined ) {
    ns.MsgBuilder = function(
        conn,
        containerId,
        userId,
        users,
        parser,
        linkExpand,
        templateManager
    ) {
        const self = this;
        self.conn = conn;
        self.containerId = containerId;
        self.userId = userId;
        self.users = users;
        self.parser = parser || null;
        self.linkEx = linkExpand || null;
        self.template = templateManager;
        
        self.envelopes = {};
        self.envelopeOrder = [];
        self.supressConfirm = false;
        
        self.init();
    }
    
    // Public
    
    ns.MsgBuilder.prototype.handle = function( event ) {
        const self = this;
        const handler = self.eventMap[ event.type ];
        if ( !handler ) {
            console.log( 'MsgBuilder.handle - no handler for event', {
                e : event,
                h : self.eventMap,
            });
            return null;
        }
        
        return handler( event.data );
    }
    
    ns.MsgBuilder.prototype.update = function( event ) {
        const self = this;
        if ( !event || !event.msgId )
            return;
        
        let update = event.message;
        let parsed = null;
        if ( self.parser )
            parsed = self.parser.work( update );
        else
            parsed = update;
        
        const el = document.getElementById( event.msgId );
        const orgEl = el.querySelector( '.msg-container .str' );
        const msgEl = el.querySelector( '.msg-container .message' );
        orgEl.textContent = update;
        msgEl.innerHTML = parsed;
        if ( self.linkEx )
            self.linkEx.work( msgEl );
    }
    
    ns.MsgBuilder.prototype.editMessage = function( itemId ) {
        const self = this;
        const el = document.getElementById( itemId );
        if ( el.isEditing )
            return;
        
        el.isEditing = true;
        el.classList.add(
            'editing',
            'BordersDefault',
            'BackgroundHeavy',
            'Rounded'
        );
        const editIconEl = el.querySelector( '.msg-container .edit-msg' );
        editIconEl.classList.toggle( 'hidden', true );
        
        const msgEl = el.querySelector( '.msg-container .str' );
        const sysEl = el.querySelector( '.system-container' );
        const currMsg = msgEl.textContent;
        const multiId = friendUP.tool.uid( 'edit' );
        const editConf = {
            multiId : multiId,
        };
        const editEl = self.template.getElement( 'edit-msg-ui-tmpl', editConf );
        const subBtn = editEl.querySelector( '.actions .edit-submit' );
        const cancelBtn = editEl.querySelector( '.actions .edit-cancel' );
        sysEl.appendChild( editEl );
        
        const multiConf = {
            containerId     : multiId,
            templateManager : self.template,
            onsubmit        : onSubmit,
            onstate         : () => {},
        };
        const edit = new library.component.MultiInput( multiConf );
        edit.setValue( currMsg );
        
        function onSubmit( newMsg ) {
            saveEdit( newMsg );
            close();
        }
        
        subBtn.addEventListener( 'click', subClick, false );
        cancelBtn.addEventListener( 'click', cancelClick, false );
        function subClick( e ) {
            let newMsg = edit.getValue();
            saveEdit( newMsg );
            close();
        }
        
        function cancelClick( e ) {
            close();
        }
        
        function saveEdit( newMsg ) {
            const edit = {
                type : 'edit',
                data : {
                    msgId   : itemId,
                    message : newMsg,
                    reson   : null,
                },
            };
            
            self.send( edit );
        }
        
        function close() {
            el.isEditing = false;
            editIconEl.classList.toggle( 'hidden', false );
            edit.close();
            editEl.parentNode.removeChild( editEl );
            el.classList.remove(
                'editing',
                'BordersDefault',
                'BackgroundHeavy',
                'Rounded'
            );
        }
    }
    
    ns.MsgBuilder.prototype.getFirstMsgId = function() {
        const self = this;
        if ( !self.envelopeOrder.length )
            return null;
        
        const firstEnvelopeId = self.envelopeOrder[ 0 ];
        const firstEnvelope = self.envelopes[ firstEnvelopeId ];
        return firstEnvelope.firstMsgId || null;
    }
    
    ns.MsgBuilder.prototype.getLastMsgId = function() {
        const self = this;
        if ( !self.envelopeOrder.length )
            return null;
        
        const eo = self.envelopeOrder;
        const lastEnvId = eo[ eo.length - 1 ];
        const lastEnvelope = self.envelopes[ lastEnvId ];
        return lastEnvelope.lastMsgId || null;
    }
    
    ns.MsgBuilder.prototype.close = function() {
        const self = this;
        if ( self.envelopeUpdate != null ) {
            window.clearTimeout( self.envelopeUpdate );
            delete self.envelopeUpdate;
        }
        
        delete self.conn;
        delete self.userId;
        delete self.users;
        delete self.onEdit;
        delete self.parser;
        delete self.linkEx;
        delete self.template;
    }
    
    // Private
    
    ns.MsgBuilder.prototype.logKlass = 'LogText';
    ns.MsgBuilder.prototype.tmplMap = {
        'msg-group'    : 'msg-group-tmpl',
        'msg'          : 'msg-tmpl',
        'action'       : 'action-tmpl',
        'notification' : 'chat-notie-tmpl',
    }
    
    ns.MsgBuilder.prototype.init = function() {
        const self = this;
        self.container = document.getElementById( self.containerId );
        if ( !self.container )
            throw new Error( 'MsgBuilder.init - container element not found for id: '
                + self.containerId );
        
        if ( !self.users || !self.template ) {
            console.log( 'MsgBuilder - missing things', self );
            throw new Error( 'MsgBuilder - missing things ^^^' );
        }
        
        self.startEnvelopeUpdates();
        
        self.eventMap = {
            'msg'          : msg,
            'action'       : action,
            'notification' : notie,
            'log'          : log,
        };
        
        function msg( e ) { return self.handleMsg( e ); }
        function action( e ) { return self.handleAction( e ); }
        function notie( e ) { return self.handleNotie( e ); }
        function log( e ) { return self.handleLog( e ); }
        
        self.logMap = {
            'msg'          : logMsg,
            'action'       : logAction,
            'notification' : logNotie,
        };
        
        function logMsg( e ) { return self.buildMsg( e ); }
        function logAction( e ) { return self.buildAction( e ); }
        function logNotie( e ) { return self.buildNotie( e ); }
    }
    
    ns.MsgBuilder.prototype.startEnvelopeUpdates = function() {
        const self = this;
        if ( self.envelopeUpdate != null )
            return;
        
        setNextUpdate();
        
        function setNextUpdate() {
            const now = Date.now();
            const midnight = new Date().setHours( 24, 0, 0, 0 ); // set time to nearest next midnight,
            // ..and it returns a timestamp of that midnight
            const timeToMidnight = midnight - now;
            self.envelopeUpdate = window.setTimeout( update, timeToMidnight );
        }
        
        function update() {
            self.updateEnvelopeDate();
            delete self.envelopeUpdate;
            setNextUpdate();
        }
    }
    
    ns.MsgBuilder.prototype.exists = function( msgId ) {
        const self = this;
        const el = document.getElementById( msgId );
        return !!el;
    }
    
    ns.MsgBuilder.prototype.handleMsg = function( event ) {
        const self = this;
        if ( self.exists( event.msgId ))
            return;
        
        const time = self.parseTime( event.time );
        const envelope = self.getEnvelope( time.envelope );
        event.time = time.time;
        const conf = {
            inGroup : self.isLastSpeaker( event, envelope ),
            event   : event,
        };
        
        const el = self.buildMsg( conf );
        envelope.lastSpeakerId = event.fromId;
        self.addItem( el, envelope );
        self.confirmEvent( 'message', event.msgId );
        return el;
    }
    
    ns.MsgBuilder.prototype.handleAction = function( event ) {
        const self = this;
        
        return el;
    }
    
    ns.MsgBuilder.prototype.handleNotie = function( event ) {
        const self = this;
        
        return el;
    }
    
    ns.MsgBuilder.prototype.handleLog = function( log ) {
        const self = this;
        let events = log.data.events;
        let newIds = log.data.ids;
        if ( newIds )
            self.users.addIdentities( newIds );
        
        self.supressConfirm = true;
        
        if ( 'before' === log.type )
            self.handleLogBefore( events );
        else
            self.handleLogAfter( events );
        
        self.supressConfirm = false;
        let lMId = self.getLastMsgId();
        self.confirmEvent( 'message', lMId );
        
    }
    
    ns.MsgBuilder.prototype.handleLogBefore = function( items ) {
        const self = this;
        var lastSpeakerId = null;
        var lastIndex = ( items.length - 1 );
        var prevEnvelope = null;
        var firstMsgId = null;
        items.forEach( handle );
        function handle( item, index ) {
            const handler = self.logMap[ item.type ];
            if ( !handler ) {
                console.log( 'no handler for event', item );
                return;
            }
            
            const event = item.data;
            if ( self.exists( event.msgId ))
                return;
            
            // 
            if ( null == firstMsgId )
                firstMsgId = event.msgId;
            
            let time = self.parseTime( event.time );
            let envelope = self.getEnvelope( time.envelope );
            if ( prevEnvelope && ( envelope.id !== prevEnvelope.id )) {
                lastSpeakerId = null;
                prevEnvelope.firstMsgId = firstMsgId;
                prevEnvelope = envelope;
            }
            
            event.time = time.time;
            let isPrevSpeaker = (( null != event.fromId ) &&
                                ( lastSpeakerId === event.fromId ));
            
            let conf = {
                inGroup : isPrevSpeaker,
                event   : event,
            };
            
            let el = handler( conf );
            self.addLogItem( el, envelope );
            
            lastSpeakerId = event.fromId;
            
            if ( index === lastIndex )
                envelope.firstMsgId = firstMsgId;
            
            prevEnvelope = envelope;
        }
        //return el;
    }
    
    ns.MsgBuilder.prototype.handleLogAfter = function( items ) {
        const self = this;
        if ( !items )
            return;
        
        items.forEach( item => self.handle( item ));
    }
    
    ns.MsgBuilder.prototype.isLastSpeaker = function( event, envelope ) {
        const self = this;
        if ( null == envelope.lastSpeakerId )
            return false;
        
        return event.fromId === envelope.lastSpeakerId;
    }
    
    ns.MsgBuilder.prototype.addItem = function( el, envelope ) {
        const self = this;
        if ( null == envelope.firstMsgId )
            envelope.firstMsgId = el.id;
        
        envelope.lastMsgId = el.id;
        envelope.el.appendChild( el );
        self.bindItem( el.id );
    }
    
    ns.MsgBuilder.prototype.addLogItem = function( el, envelope ) {
        const self = this;
        if ( !envelope.firstMsgId )
            envelope.lastMsgId = el.id;
        
        const before = document.getElementById( envelope.firstMsgId );
        envelope.el.insertBefore( el, before );
        self.bindItem( el.id );
    }
    
    ns.MsgBuilder.prototype.buildMsg = function( conf ) {
        const self = this;
        const tmplId =  conf.inGroup ? 'msg-tmpl' : 'msg-group-tmpl';
        //const tmplId = 'msg-tmpl';
        const msg = conf.event;
        const uId = msg.fromId;
        const mId = msg.msgId;
        const isGuest = uId == null ? true : false;
        
        let name = '';
        let userKlass = '';
        let bgKlass = 'sw1';
        let editKlass = 'hidden';
        if ( isGuest ) {
            name = 'Guest > ' + msg.name;
            userKlass = 'guest-user-klass';
        } else {
            name = msg.name;
            userKlass = uId + '-klass';
        }
        
        if ( uId === self.userId ) {
            bgKlass = 'sw2';
            editKlass = '';
        }
        
        let original = msg.message;
        let message = null;
        if ( self.parser )
            message = self.parser.work( original );
        else
            message = original;
        
        const msgConf = {
            msgId     : mId,
            userKlass : userKlass,
            bgKlass   : bgKlass,
            from      : name,
            time      : msg.time,
            original  : original,
            message   : message,
            editKlass : editKlass,
        };
        const el = self.template.getElement( tmplId, msgConf );
        if ( self.linkEx )
            self.linkEx.work( el );
        
        return el;
    }
    
    ns.MsgBuilder.prototype.buildAction = function() {
        const self = this;
    }
    
    ns.MsgBuilder.prototype.buildNotie = function() {
        const self = this;
    }
    
    ns.MsgBuilder.prototype.bindItem = function( itemId ) {
        const self = this;
        const el = document.getElementById( itemId );
        const editBtn = el.querySelector( '.msg-container .edit-msg' );
        editBtn.addEventListener( 'click', editClick, false );
        function editClick( e ) {
            self.editMessage( itemId );
        }
    }
    
    ns.MsgBuilder.prototype.getEnvelope = function( envConf ) {
        const self = this;
        let envelope = self.envelopes[ envConf.id ];
        if ( envelope )
            return envelope;
        
        envelope = envConf;
        const el = self.template.getElement( 'time-envelope-tmpl', envConf );
        envelope.el = el;
        self.envelopes[ envelope.id ] = envelope;
        self.envelopeOrder.push( envelope.id );
        self.envelopeOrder.sort( oldFirst );
        const index = self.envelopeOrder.indexOf( envelope.id );
        const beforeId = self.envelopeOrder[( index + 1 )] || null;
        let beforeEl = null;
        if ( beforeId )
            beforeEl = document.getElementById( beforeId );
        
        self.container.insertBefore( envelope.el, beforeEl );
        return envelope;
        
        function oldFirst( idA, idB ) {
            let a = self.envelopes[ idA ];
            let b = self.envelopes[ idB ];
            if ( a.order > b.order )
                return 1;
            else
                return -1;
        }
    }
    
    ns.MsgBuilder.prototype.updateEnvelopeDate = function() {
        const self = this;
        self.envelopeOrder.forEach( eId => {
            let env = self.envelopes[ eId ];
            let timeStr = self.getEnvelopeDayString( env.time, env.order );
            let timeEl = env.el.querySelector( '.envelope-date' );
            timeEl.textContent = timeStr;
        });
    }
    
    ns.MsgBuilder.prototype.parseTime = function( timestamp ) {
        const self = this;
        const time = new Date( timestamp );
        if ( !time )
            return null;
        
        const tokens = {
            time       : getClockStamp( time ),
            date       : getDateStamp( time ),
            envelope   : getEnvelope( time ),
            timestamp  : timestamp,
        };
        
        return tokens;
        
        //
        function getClockStamp( time ) {
            let str = ''
                + pad( time.getHours()) + ':'
                + pad( time.getMinutes()) + ':'
                + pad( time.getSeconds());
            return str;
        }
        
        function getDateStamp( time ) {
            return time.toLocaleDateString();
        }
        
        function getEnvelope( time ) {
            const order = self.getEnvelopeTime( time );
            const id = 'envelope-' + order.toString();
            const date = self.getEnvelopeDayString( time, order );
            const envelope = {
                id    : id,
                date  : date,
                time  : time,
                order : order,
            };
            return envelope;
        }
        
        function pad( time ) {
            var str = time.toString();
            return 1 !== str.length ? str : '0' + str;
        }
    }
    
    ns.MsgBuilder.prototype.getEnvelopeTime = function( time ) {
        const self = this;
        const timeStr = getTimeStr( time );
        const envTime = parseInt( timeStr, 10 );
        return envTime;
        
        function getTimeStr( time ) {
            let str = ''
            + pad( time.getFullYear())
            + pad(( time.getMonth() + 1 ))
            + pad( time.getDate());
            return str;
        }
        
        function pad( time ) {
            var str = time.toString();
            return 1 !== str.length ? str : '0' + str;
        }
    }
    
    ns.MsgBuilder.prototype.getEnvelopeDayString = function( time, envelopeTime ) {
        const self = this;
        const now = new Date();
        const today = self.getEnvelopeTime( now );
        const yesterday = today - 1;
        const isToday = ( envelopeTime === today );
        const isYesterday = ( envelopeTime === yesterday );
        if ( isToday )
            return View.i18n( 'i18n_today' );
        
        if ( isYesterday )
            return View.i18n( 'i18n_yesterday' );
        
        return time.toLocaleDateString();
    }
    
    ns.MsgBuilder.prototype.confirmEvent = function( type, eventId ) {
        const self = this;
        if ( self.supressConfirm )
            return;
        
        const confirm = {
            type : 'confirm',
            data : {
                type    : type,
                eventId : eventId,
            },
        };
        self.send( confirm );
    }
    
    ns.MsgBuilder.prototype.send = function( event ) {
        const self = this;
        const wrap = {
            type : 'chat',
            data : event,
        };
        self.conn.send( wrap );
    }
    
})( library.component );


// emojii panel
(function( ns, undefined ) {
    ns.EmojiiPanel = function(
        parentId,
        templateManager,
        emojiiMap,
        onemojii
    ) {
        const self = this;
        
        self.parentId = parentId;
        self.template = templateManager;
        self.emojiiMap = emojiiMap;
        self.onemojii = onemojii;
        
        self.el = null;
        
        self.init();
    }
    
    // Public
    
    ns.EmojiiPanel.prototype.show = function() {
        const self = this;
        if ( !self.el )
            return;
        
        self.el.classList.toggle( 'hidden', false );
        self.el.focus();
    }
    
    ns.EmojiiPanel.prototype.hide = function() {
        const self = this;
        if ( !self.el )
            return;
        
        self.el.classList.toggle( 'hidden', true );
    }
    
    ns.EmojiiPanel.prototype.close = function() {
        const self = this;
        if ( self.el )
            self.el.parentNode.removeChild( self.el );
        
        delete self.template;
        delete self.emojiiMap;
        delete self.onemojii;
        delete self.el;
    }
    
    // Private
    
    ns.EmojiiPanel.prototype.init = function() {
        const self = this;
        const conf = {
            id : friendUP.tool.uid( 'emojii' ),
        };
        self.el = self.template.getElement( 'emojii-panel-tmpl', conf );
        const parent = document.getElementById( self.parentId );
        if ( !parent )
            throw new Error( 'EmojiiPanel - no element found for parentId' );
        
        parent.appendChild( self.el );
        self.el.tabIndex = -1; // so its focusable
        self.el.addEventListener( 'blur', emoPanelBlur, false );
        self.el.addEventListener( 'focus', emoFocus, false );
        
        function emoPanelBlur( e ) {
            self.hide();
        }
        
        function emoFocus( e ) {
        }
        
        //
        const emoKeys = Object.keys( self.emojiiMap );
        emoKeys.forEach( buildAndBind );
        function buildAndBind( key ) {
            const value = self.emojiiMap[ key ];
            const itemEl = self.template.getElement( 'emojii-item-tmpl', { itml : value });
            itemEl.addEventListener( 'click', emoClick, false );
            self.el.appendChild( itemEl );
            
            function emoClick( e ) {
                e.stopPropagation();
                e.preventDefault();
                self.onemojii( key );
                self.hide();
            }
        }
    }
    
})( library.component );

(function( ns, undefined ) {
    ns.LogFetcher = function(
        parentId,
        messagesId,
        templateManager,
        onFetch
    ) {
        const self = this;
        self.parentId = parentId;
        self.messagesId = messagesId;
        self.template = templateManager;
        self.onfetch = onFetch;
        
        self.locked = false;
        self.noLogs = false;
        
        self.init();
    }
    
    // Public
    
    ns.LogFetcher.prototype.unlock = function() {
        const self = this;
        self.toggleFetching( false );
    }
    
    ns.LogFetcher.prototype.setNoLogs = function( isNoLogs ) {
        const self = this;
        self.noLogs = isNoLogs;
        if ( self.lockOut )
            clearTimeout( self.lockOut );
        
        self.lockOut = null;
        self.toggleFetching( false );
        self.infoNone.classList.toggle( 'hidden', !isNoLogs );
    }
    
    ns.LogFetcher.prototype.close = function() {
        const self = this;
        delete self.template;
        delete self.parentId;
        delete self.messagesId;
        delete self.onfetch;
        
        delete self.infoFetch;
        delete self.infoNone;
        delete self.info;
    }
    
    // Private
    
    ns.LogFetcher.prototype.init = function() {
        const self = this;
        // make sure we have valid ids
        self.parent = document.getElementById( self.parentId );
        if ( !self.parent ) {
            console.log( 'LogFetcher - no element for id', self.parentId );
            throw new Error( 'abloo ablooo ^^^' );
        }
        
        self.messages = document.getElementById( self.messagesId );
        if ( !self.messages ) {
            console.log( 'LogFetcher - no element for id', self.messagesId );
            throw new Error( 'more abloos ^^^' );
        }
        
        // insert log fetch UX element
        self.infoId = friendUP.tool.uid( 'log-fetch' );
        const infoConf = {
            id : self.infoId,
        };
        self.info = self.template.getElement( 'log-fetch-tmpl', infoConf );
        self.messages.appendChild( self.info );
        self.infoFetch = self.info.querySelector( '.log-fetch-msg' );
        self.infoNone = self.info.querySelector( '.log-no-logs' );
        self.infoHeight = self.info.clientHeight;
        
        //bind
        self.parent.addEventListener( 'wheel', wheel, true );
        function wheel( e ) {
            e.stopPropagation();
            self.checkIsScrolledUp( e );
        }
    }
    
    ns.LogFetcher.prototype.checkIsScrolledUp = function( e ) {
        const self = this;
        if ( 0 < e.deltaY )
            return;
        
        if ( self.locked || self.lockOut )
            return;
        
        if ( self.noLogs )
            return;
        
        const msgST = self.messages.scrollTop;
        const infoH = self.infoHeight;
        // if we are more than two info heights from the top, we dont care
        if ( msgST > ( infoH * 2 ))
            return;
        
        self.toggleFetching( true );
        self.onfetch();
    }
    
    ns.LogFetcher.prototype.toggleFetching = function( isFetching ) {
        const self = this;
        self.locked = isFetching;
        if ( isFetching )
            self.lockOut = setTimeout( unlock, 3000 );
        
        const isUnlocked = !self.locked && ( null == self.lockOut );
        self.infoFetch.classList.toggle( 'hidden', isUnlocked );
        
        function unlock() {
            self.lockOut = null;
            if ( !self.locked )
                self.toggleFetching ( false );
        }
    }
    
})( library.component );

/*
    LiveStatus
*/

(function( ns, undefined ) {
    ns.LiveStatus = function(
        containerId,
        users,
        userId,
        tmplManager
    ) {
        const self = this;
        self.containerId = containerId;
        self.users = users;
        self.userId = userId;
        self.template = tmplManager;
        
        self.peerIdMap = {};
        self.peerList = [];
        
        self.init();
    }
    
    // Public
    
    ns.LiveStatus.prototype.update = function( peerList ) {
        const self = this;
        peerList.forEach( peerId => self.addPeer( peerId ));
    }
    
    ns.LiveStatus.prototype.close = function() {
        const self = this;
        self.users.off( self.stateEventId );
        
        self.el.parentNode.removeChild( self.el );
        delete self.el;
        delete self.peers;
        delete self.peerList;
        delete self.peerIdMap;
        
        delete self.users;
        delete self.userId;
        delete self.template;
        delete self.containerId;
    }
    
    // Private
    
    ns.LiveStatus.prototype.init = function() {
        const self = this;
        
        // build
        self.peers = friendUP.tool.uid( 'peers' );
        const elConf = {
            peersId : self.peers,
        };
        self.el = self.template.getElement( 'live-status-tmpl', elConf );
        const container = document.getElementById( self.containerId );
        container.appendChild( self.el );
        self.peers = document.getElementById( self.peers );
        
        // listen
        self.stateEventId = self.users.on( 'state', live );
        function live( e ) { self.handleLive( e ); }
    }
    
    ns.LiveStatus.prototype.handleLive = function( event ) {
        const self = this;
        if ( 'live' !== event.state )
            return;
        
        if ( event.isSet )
            self.addPeer( event.userId );
        else
            self.removePeer( event.userId );
    }
    
    ns.LiveStatus.prototype.addPeer = function( userId ) {
        const self = this;
        if ( self.peerList.some( pId => pId === userId ))
            return;
        
        const peerId = friendUP.tool.uid( 'peer' );
        const avatarKlass = self.users.getAvatarKlass( userId );
        const peer = {
            id          : peerId,
            avatarKlass : avatarKlass,
        };
        const peerEl = self.template.getElement( 'live-status-peer-tmpl', peer );
        self.peerIdMap[ userId ] = peerId;
        self.peers.appendChild( peerEl );
        self.peerList.push( userId );
        self.updateVisibility();
    }
    
    ns.LiveStatus.prototype.removePeer = function( userId ) {
        const self = this;
        let peerId = self.peerIdMap[ userId ];
        if ( !peerId )
            return;
        
        delete self.peerIdMap[ userId ];
        const el = document.getElementById( peerId );
        el.parentNode.removeChild( el );
        self.peerList = self.peerList.filter( pId => pId !== userId );
        self.updateVisibility();
    }
    
    ns.LiveStatus.prototype.updateVisibility = function() {
        const self = this;
        const show = !!self.peerList.length ? true : false;
        self.el.classList.toggle( 'hidden', !show );
    }
    
})( library.component );

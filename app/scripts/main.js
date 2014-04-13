var Card = Backbone.Model.extend({
  defaults: {
    column: 0,
    row: 0,
    cardTypeName: null
  }
});

var CardColumn = Backbone.Collection.extend({
  model: Card,
    comparator: function (cardA, cardB) { 
      if (cardA.get('column') < cardB.get('column')) {
        return -1;
      } else if (cardA.get('column') > cardB.get('column')) {
        return 1;
      } else if (cardA.get('row') < cardB.get('row')) {
        return -1;
      } else if (cardA.get('row') > cardB.get('row')) {
        return 1;
      } else {
        return 0;
      }
    }
});

var CardView = Backbone.View.extend({

  template: null,
    tagName: 'li',
    className: 'card',

    render: function () {
      var button = '<button class="close glyphicon glyphicon-remove"></button>';
      var name = this.model.get('cardTypeName');
      var cardType = cardTypesList.findWhere({name: name});
      var render = cardType.get('render').bind(cardType);

      this.$el.html(button + render());
      return this;
    },

    events: {
      'click .close': 'closeCard'
    },

    closeCard: function() {
      this.model.destroy();
    }
});

var ColumnView = Backbone.View.extend({
  tagName: 'ul',
    className: 'dash',
    itemView: CardView,
    _listItems: null,
    _listIsSyncing: false,
    _numColumns: 0,

    initialize: function () {
      this.collection.bind('sync reset add destroy', function() { 
        this.listSync();
        this.persist();
      }.bind(this));

      this.on('sorted', this.persist.bind(this));

    },

    persist: function () {
        localStorage.setItem('cards', JSON.stringify(this.collection))
    },
    
    render: function () {
      this._listItems = {};

      this.listSync();

      return this;
    },

    events: {
      'sortupdate' :  'handleSortComplete'
    },

    handleSortComplete: function () {

      _.each( this._listItems, function ( v ) {
            v.model.set('row', v.$el.index());
            v.model.set('column', v.$el.parent().parent().index());
         });

      this.collection.sort({silent: true});

      this.trigger('sorted');
    },

    listSetup: function () {
        this.$('ul').each(function () {
          $(this).sortable({ 
            connectWith: '.sortable',
            dropOnEmpty: true,
            tolerance: 'pointer' });
        });
    },

    addColumn: function() {
      this.$el.append("<li><ul class='sortable column' id='" + this._numColumns + "'></ul></li>");
      this._numColumns += 1;
    },

    listSync: function() {
      var list = this.collection.models;

      var startCols = Math.max.apply(null, list.map(function (el) { return el.attributes.column })) + 1;
      for (var i = this._numColumns; i < startCols; i++) {
        this.addColumn();
      }

      this._listIsSyncing = true;
      _.invoke( this._listItems, 'remove' );
      this._listItems = {};

      for ( var m in list )
         this.listAdd( list[m] );

      this._listIsSyncing = false;

      this.listSetup();

    },

    listAdd: function ( model ) {

      var v;

      if ( !this._listItems[model.cid] ) {
        v = this._listItems[model.cid] = new this.itemView({ model: model });

        this.$('#' + model.get('column')).append(v.render().$el);
      }

      if ( !this._listIsSyncing )
         this.listSetup();
   },

    listRemove: function ( model ) {

      if ( this._listItems[model.cid] ) {
         this._listItems[model.cid].remove();
         delete this._listItems[model.cid];
      }

      if ( !this._listIsSyncing )
         this.listSetup();

   },

    remove: function () {

      _.invoke( this._listItems, 'remove' );

   }
});

$(function () {
  var cards = new CardColumn(JSON.parse(localStorage.getItem('cards')) ||
    []);

  var columnList = new ColumnView({collection: cards});
  
  var cardTypesViews = new CardTypesView({collection: cardTypesList});

  $('#cardTypes').append(cardTypesViews.render().$el);

  $('#dashboard').append(columnList.render().$el);


  // TODO: move these handlers to their respective views
  
  $('#addColumnButton').click(function () {
    columnList.addColumn();
    $('.column').each(function () {
      $(this).sortable({ 
        connectWith: '.sortable',
        dropOnEmpty: true,
        tolerance: 'pointer'
      });
    });
  });

  $('#addCardButton').click(function () {
    if (columnList._numColumns == 0) columnList.addColumn();
    var maxRowInLastColumn = Math.max.apply(null,
      columnList.collection.filter(function (el) {
        return el.attributes.column == columnList._numColumns - 1;
      })
      .map(function (el) {
        return el.attributes.row;
      }));
    var name = $('#cardTypes').find(':selected').text();
    columnList.collection.add({
      row: maxRowInLastColumn == -Infinity ? 0 : maxRowInLastColumn + 1,
      column: columnList._numColumns - 1,
      cardTypeName: name
    });
  });
    $('#newTodo').keyup(function (event) {
      var todos = JSON.parse(localStorage.getItem('todo')) || [];
      if (event.which == 13) {
        todos.push($(this).val());
        $('#todo').append('<li><h3>' + $(this).val() + '</li></h3>');
        $(this).val('');
        localStorage.setItem('todo', JSON.stringify(todos));
      }
    });

});

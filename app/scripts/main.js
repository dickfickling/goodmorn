var Card = Backbone.Model.extend({
  defaults: {
    column: 0,
    row: 0,
    title: ''
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
      this.$el.html(new Array(3).join(this.model.get('title') + '<br />'));
      return this;
    }
});

var ColumnView = Backbone.View.extend({
  tagName: 'ul',
    className: 'dash',
    itemView: CardView,
    _listItems: null,
    _listIsSyncing: false,
    _numColumns: 0,
    
    render: function () {
      this._listItems = {};

      this.listenTo( this.collection, 'sync reset', this.listSync );

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
          $(this).draggable();
        });
    },

    addColumn: function() {
      this.$el.append("<li><ul class='sortable column' id='" + this._numColumns + "'></ul></li>");
      this._numColumns += 1;
    },

    listSync: function() {
      var list = this.collection.models;

      var startCols = Math.max.apply(null, list.map(function (el) { return el.attributes.column })) + 1;
      for (var i = 0; i < startCols; i++) {
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
  var cards = new CardColumn([
    { row: 0, column: 0, title: 'Item 1' },
    { row: 1, column: 0, title: 'Item 2' },
    { row: 2, column: 1, title: 'Item 3' },
    { row: 3, column: 1, title: 'Item 4' },
    { row: 1, column: 2, title: 'Item 5' },
    { row: 2, column: 2, title: 'Item 6' },
    { row: 3, column: 2, title: 'Item 7' },
    ]);

  var columnList = new ColumnView({collection: cards});

  $('#dashboard').append(columnList.render().$el);

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

});

var CardType = Backbone.Model.extend({
  defaults: {
    name: '',
    render: function() { return this.render(); }
  }
});

var Todo = CardType.extend({
  defaults: {
    name: 'Todo',
    render: function () { return this.render(); }
  },
  render: function () {
    var todos = JSON.parse(localStorage.getItem('todo')) || [];
    var html = '<ul id="todo" class="cardType">';
    _.each(todos, function (todo) {
      html += '<li><h3>' + todo + '</h3></li>';
    });
    html += '</ul>';
    html += '<input class="form-control" id="newTodo" placeHolder="What do you have to do?">';
    return html;
  }
});

var CardTypeView = Backbone.View.extend({
  tagName: 'option',
  className: 'cardType',

  render: function () {
    this.$el.html(this.model.get('name'));
    return this;
  }
});

var CardTypes = Backbone.Collection.extend({
  model: function (attrs, options) {
    switch (attrs.type) {
      case 'Todo':
        return new Todo(attrs, options);
        break;
      default:
        return null;
    }
  }

});

var cardTypesList = new CardTypes([
    { type: 'Todo' }
    ]);

var CardTypesView = Backbone.View.extend({
  tagName: 'select',
  id: 'cardTypes',
  className: 'form-control',
  render: function () {
    _.each(this.collection.models, function (cardType) {
      this.$el.append(new CardTypeView({model: cardType}).render().el);
    }, this);
    return this;
  }
});

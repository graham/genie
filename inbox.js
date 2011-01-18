var Inbox = function(root) {
    this.reset();
    if (root) {
        this.initialize(root);
        this.refresh();
    }
};

Inbox.prototype = new Terminal();

Inbox.prototype.initialize = function(root) {
    console.log("Inbox init");
    Terminal.prototype.initialize.call(this, root);

    this.data = {}
    this.data['items'] = [];

    this.data['current_item'] = 0;

    inbox.modified_dict['j'] = function(term) {
	term.move_cursor_to_index( term.data['current_item'] + 1 )
    };

    inbox.modified_dict['shift-j'] = function(term) {
	term.move_cursor_to_index( term.data['current_item'] + 4 )
    }
    inbox.modified_dict['k'] = function(term) {
	term.move_cursor_to_index( term.data['current_item'] - 1 )
    };
    inbox.modified_dict['shift-k'] = function(term) {
	term.move_cursor_to_index( term.data['current_item'] - 4 )
    };

    inbox.modified_dict['tab'] = function(term) {
	return_focus();
    }

    inbox.modified_dict['x'] = function(term) {
	var sitem = term.data.items[term.data.current_item];
	sitem.checked = !sitem.checked;
	$$('#item_' + term.data['current_item'] + ' > .checker > input').each(function(item) {
		item.checked = !item.checked;
	    });
    }

    // key aliases.
    inbox.modified_dict['up'] = inbox.modified_dict['k'];
    inbox.modified_dict['down'] = inbox.modified_dict['j'];
    inbox.modified_dict['space'] = inbox.modified_dict['x'];

    this.refresh();
};

Inbox.prototype.refresh = function() {
    if (this.is_drawn) {
	//var d = $('item_' + this.data['current_item']);
	//window.scrollTo(0, d.getPosition().y);
	var d = this;
	$$('.inbox_case > .focus_status').each( function(item) {
		var l = [];
		var result = d.get_selected();
		last = result;
		for( var i=0; i < result.length; i++) {
		    l.push(result[i].id.split('_')[1]);
		}
		item.innerHTML = l.join(', ');
	    });
    } else {
	this.root.innerHTML = this.env.render('inbox', this.data);
	this.is_drawn = true;
    }
};

Inbox.prototype.force_refresh = function() {
    this.is_drawn = false;
    this.refresh();
};

Inbox.prototype.get_selected = function() {
    var result = [];
    $$('.inbox_item > .checker > input:checked').each( function(item) {
	    result.push(item.getParent().getParent());
	});
    return result;
};

Inbox.prototype.add_item = function() { };
Inbox.prototype.remove_item = function() { };
Inbox.prototype.remove_current_item = function() { };
Inbox.prototype.move_cursor_to_index = function(index) {
    $$('#item_' + this.data['current_item'] + ' > .selector').each( function(item) {
	    item.innerHTML = '&nbsp;';
	});
    $('item_'+this.data['current_item']).removeClass('current_item');
    
    this.data['current_item'] = index;

    if (index >= this.data['items'].length) {
	this.data['current_item'] = this.data['items'].length - 1;
    }

    if (index < 0) {
	this.data['current_item'] = 0;
    }
    
    $('item_' + this.data['current_item']).addClass('current_item');
    $$('#item_' + this.data['current_item'] + ' > .selector').each( function(item) {
	    item.innerHTML = '&rsaquo;';
	});
};

InboxItem = function() {
    this.title = 'Inbox Item';
    this.bouy = 0;
    this.checked = false;
}

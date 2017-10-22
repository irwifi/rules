$(function() {
  // Load Rule Groups
  rrules_load_groups();

  // Load the rules of Group 1 on document ready
  rrules_load_rules(1);

  // Drop Rules to used rule area
  rrules_drop_to_used();

  // Drop Rules to rule definition
  rrules_drop_to_definition();

  // Select Rule Group from the dropdown
  $(".rrules_group_list select").on("change", rrules_reload_group);
});

// Load Rule Groups
function rrules_load_groups() {
  // Get Rule Groups from the URL link
  $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleGroups", function(groups) {
    $.each(groups, function(key, value){
      $(".rrules_group_list select").append("<option value='" + value.ID + "'>" + value.Name + "</option>");
    });
  });
}

// Reload Rule Group
function rrules_reload_group() {
  var group_id =  $(".rrules_group_list select").val();
  var current_group_id = $(".rrules_group_label").attr("data-id");
  if(group_id > 0 && group_id !== current_group_id) {
    $('.rrules_group_list select option:eq(0)').prop('selected', true);
    $(".rrules_rules_box div:not(.rrules_rules_title)").remove();
    // Load the rules of Group
    rrules_load_rules(group_id);
  }
}

// Load the rules
function rrules_load_rules(group_id) {
  // Get Rule details from the URL link
  $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRules", function(rules){
    $.each(rules, function(key, value){
      // Load Rule definitions, Clone each Rule item and apply Id and Name to that item
      $("#rrules_rule_sample").clone().attr({"id": "rrules_rule_id_" + value.ID, "data-rule-name": value.Name, "data-rule-desc": value.Description}).addClass("new rrules_type_definition").removeClass("hidden").appendTo(".rrules_rules_definition .rrules_rules_box");
      $("#rrules_rule_id_" + value.ID + " .rrules_rule_name").text(value.Name);
    });

    // Load the rule group
    rrules_load_rule_group(group_id);
  });
}

// Load the rule group
function rrules_load_rule_group(group_id) {
  // Load Rule Group details
  $.getJSON("http://tbc.etracinc.com:247/AIS/GetRuleGroupInfo?GroupID="+group_id, function(data) {
    // Get Rule Group Severity from the URL link
    $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleSeverity", function(severity) {
      $.each(severity, function(key, value) {
        var option_html = "<option value='" + value.ID + "'";
        if(value.ID === data.Severity) {
          option_html = option_html + ' selected = "selected"';
          $(".rrules_group_info_severity").text("(" + value.Name + ")");
        }
        option_html = option_html + ">" + value.Name + "</option>";
        $(".rrules_group_severity select").append(option_html);
      });
    });

    $(".rrules_group_label").attr({"data-id": group_id})
    $(".rrules_group_info_name").text(data.Name);
    $(".rrules_group_name input").val(data.Name);

    $(".rrules_group_info_edit input").on("click", function() {
      $(".rrules_group_info").hide();
      $(".rrules_group_edit").show();
    });

    $(".rrules_group_cancel input").on("click", function() {
      $(".rrules_group_info").show();
      $(".rrules_group_edit").hide();
    });

    // Load used Rules
    rrules_load_used_rules(data.RulesID);

    // Load Rule events
    rrules_load_rules_events();

  // Initiate the draggable elements
  rrules_init_sortable();
  });
}

// Load used Rules
function rrules_load_used_rules(used_rules) {
    $.each(used_rules, function(key, id) {
      var rule_name = $("#rrules_rule_id_"+id).attr("data-rule-name");
      var rule_desc = $("#rrules_rule_id_"+id).attr("data-rule-desc");
      $("#rrules_rule_sample").clone().attr({"id": "rrules_used_rule_id_" + id, "data-rule-name": rule_name, "data-rule-desc": rule_desc}).addClass("new rrules_type_used").removeClass("hidden").appendTo(".rrules_rules_used .rrules_rules_box");
      $("#rrules_used_rule_id_" + id + " .rrules_rule_name").text(rule_name);

      // Mark used Rule in definition
      // rrules_mark_used_rule(id);

    // Hide used Rule in definition
    rrules_hide_used_rule(id);
    });
}

// Mark used Rule in definition
function  rrules_mark_used_rule(rule_id) {
  $("#rrules_rule_id_" + rule_id).removeClass("rrules_type_definition ui-draggable ui-draggable-handle").addClass("rrules_type_definition_used");
  $("#rrules_rule_id_" + rule_id + " .rrules_used_hint").text("(used)");

  // Hide Rule instead of marking
  // rrules_hide_used_rule(rule_id);
}

// Hide used Rule in definition
function  rrules_hide_used_rule(rule_id) {
  $("#rrules_rule_id_" + rule_id).removeClass("rrules_type_definition ui-draggable ui-draggable-handle").addClass("rrules_type_definition_used hidden");
}

// Load Rule events
function rrules_load_rules_events() {
  // Clear existing events
  $(".rrules_rule_item.new").off();
  $(".rrules_rules_used .rrules_rule_item.new .rrules_rule_delete").off();

  // Hover and unhover events on Rule item
  $(".rrules_rule_item.new").hover(rrules_rule_hover, rrules_rule_unhover);
  // Click the Rule to select it
  $(".rrules_rule_item.new").on("click", function() {rrules_toggle_rule_select($(this));});

  // Delete Rule from used Rule
  $(".rrules_rules_used .rrules_rule_item.new .rrules_rule_delete").on("click", function(event) {
    // Stop Rule selection
    event.stopPropagation();

    var element = $(this).closest(".rrules_rule_item");
    rrules_remove_used_rule(element);
  });

  // Remove class .new from New items
  $(".new").removeClass("new");
}

// Hover event on Rule item
function rrules_rule_hover() {
  // Show the Rule id and name of the hovered Rule
  $(".rrules_rule_info_name").text($(this).find(".rrules_rule_name").text()).addClass("on");
  $(".rrules_rule_hint").text("(" + $(this).attr("data-rule-desc") + ")");
}

// Unhover event on Rule item
function rrules_rule_unhover() {
  if($(".rrules_rule_name_label").hasClass("active") === true) {
    $(".rrules_rule_info_name").text($(".rrules_rule_item.selected:eq(0) .rrules_rule_name").text()).removeClass("on");
    $(".rrules_rule_hint").text("(" + $(".rrules_rule_item.selected").attr("data-rule-desc") + ")");
  }else{
    $(".rrules_rule_info_name").text("Rule Info").removeClass("on");
    $(".rrules_rule_hint").text("(hover on any rule)");
  }
}

// Toggle Rule selection
function rrules_toggle_rule_select(element) {
  if(element.hasClass("selected") === true) {
    // Clear Rule selection
    $(".rrules_rule_item.selected").removeClass("selected");
    // Remove Rule info panel
    $(".rrules_rule_name_label").removeClass("active");
  } else {
    // Clear Rule selection
    $(".rrules_rule_item.selected").removeClass("selected");
    // Select the clicked Rule
    element.addClass("selected");
    $(".rrules_rule_name_label").addClass("active");
  }
}

// Initiate the draggable elements
function rrules_init_sortable() {
  $( ".sortable1, .sortable2" ).sortable({
    revert: true,
    helper: "clone"
  });
}

// Drop Rules to used rule area
function rrules_drop_to_used() {
  $( ".rrules_rules_used .rrules_rules_box" ).droppable({
    accept: ".rrules_type_definition",
    drop: function( event, ui ) {
      var rule_id = $(ui.helper).attr("id").replace("rrules_rule_id_", "");
      $(ui.helper).clone().attr("id", "rrules_used_rule_id_" + rule_id).addClass("new rrules_type_used").removeClass("rrules_type_definition ui-draggable ui-draggable-handle ui-draggable-dragging").removeAttr("style").appendTo($(this));
      $(ui.helper).remove();

      // Mark used Rule in definition
      // rrules_mark_used_rule(rule_id);

    // Hide used Rule in definition
    rrules_hide_used_rule(rule_id);

      // Load Rule events
      rrules_load_rules_events();

      // Get Rule Groups from the URL link
      // $.getJSON("http://tbc.etracinc.com:247/AIS/AddNewRuleToRuleGroup?GroupID=1&RuleID=" + rule_id + "&Order=1", function(result) {
      //   console.log(result);
      //   alert(result);
      // });
    }
  });
}

// Drop Rules to rule definition
function rrules_drop_to_definition() {
  $( ".rrules_rules_definition .rrules_rules_box" ).droppable({
    accept: ".rrules_type_used",
    drop: function( event, ui ) {
      var element = $("#" + ui.draggable.attr("id"));
      ui.helper.remove();
      rrules_remove_used_rule(element);
    }
  });
}

// Remove used Rule
function rrules_remove_used_rule(element) {
  var id = element.attr("id").replace("rrules_used_rule_id_", "");
  $("#rrules_rule_id_" + id).addClass("new rrules_type_definition").removeClass("rrules_type_definition_used hidden");
  $("#rrules_rule_id_" + id + " .rrules_used_hint").text("");
  if(element.hasClass("selected") === true) {
    // Clear Rule selection
    $(".rrules_rule_item.selected").removeClass("selected");
    // Reset Rule info panel
    $(".rrules_rule_name_label").removeClass("active");
  }
  // Delete used Rule
  element.remove();
  rrules_rule_unhover();
}
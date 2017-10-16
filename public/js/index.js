$(function() {
  // Load the rules on document ready
  rrules_load_rules();
  
  $( ".rrules_rules_used .rrules_rules_box" ).droppable({
    accept: ".rrules_type_definition",
    drop: function( event, ui ) {
      var rule_id = $(ui.helper).find(".rrules_rule_id").text().replace("Rule ", "");
      $(ui.helper).clone().attr("id", "rrules_used_rule_id_" + rule_id).addClass("new rrules_type_used").removeClass("rrules_type_definition ui-draggable ui-draggable-handle ui-draggable-dragging").removeAttr("style").appendTo($(this));
      $("#rrules_used_rule_id_" + rule_id + " .rrules_used_hint").remove();
      // Mark used Rules in definition
      rrules_mark_used_rule(rule_id);

      // Load events on newly cloned elements
      rrules_load_rules_events();
    }
  });
  
  $( ".rrules_rules_definition .rrules_rules_box" ).droppable({
    accept: ".rrules_type_used",
    drop: function( event, ui ) {console.log(ui);
//      $("#" + ui.draggable.attr("id")).remove();
      var element = $("#" + ui.draggable.attr("id"));
      rrules_remove_used_rule(element);
    }
  });
});

// Load the rules
function rrules_load_rules() {
  // Get Rule details from the URL link
  $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRules", function(rules){
    $.each(rules, function(key, value){
      // Load Rule definitions, Clone each Rule item and apply Id and Name to that item
      $("#rrules_rule_sample").clone().attr({"id": "rrules_rule_id_" + value.ID, "data-rule-name": value.Name}).addClass("new rrules_type_definition").removeClass("hidden").appendTo(".rrules_rules_definition .rrules_rules_box");
      $("#rrules_rule_id_" + value.ID + " .rrules_rule_id").text("Rule "+ value.ID);

      // Load used Rules
      $("#rrules_rule_sample").clone().attr({"id": "rrules_used_rule_id_" + value.ID, "data-rule-name": value.Name}).addClass("new rrules_type_used").removeClass("hidden").appendTo(".rrules_rules_used .rrules_rules_box");
      $("#rrules_used_rule_id_" + value.ID + " .rrules_rule_id").text("Rule "+ value.ID);
      
      // Mark used Rules in definition
      rrules_mark_used_rule(value.ID);
    });
    
    // Load Rule events
    rrules_load_rules_events();
  });
}

// Load Rule events
function rrules_load_rules_events() {
  // Clear existing events
  $(".rrules_rules_box").off();
  $(".rrules_rule_item.new").off();
  $(".rrules_rules_used .rrules_rule_item.new .rrules_rule_delete").off();
  
  // Hover and unhover events on Rule item
  $(".rrules_rule_item.new").hover(rrules_rule_hover, rrules_rule_unhover);
  // Reset the Rule info panel
  $(".rrules_rules_box").on("mouseleave", rrules_rule_info_reset);
  // Click the Rule to select it
  $(".rrules_rule_item.new").on("click", function() {rrules_toggle_rule_select($(this));});
  
  // Delete Rule from used Rule
  $(".rrules_rules_used .rrules_rule_item.new .rrules_rule_delete").on("click", function(event) {
    // Stop Rule selection
    event.stopPropagation();
    var element = $(this).closest(".rrules_rule_item");
    rrules_remove_used_rule(element);
  });
  
  // Initiate the draggable elements
  rrules_init_draggable();
  
  // Remove class .new from New items
  $(".new").removeClass("new");
}

// Initiate the draggable elements
function rrules_init_draggable() {
  $(".rrules_rule_item.new:not(.rrules_type_definition_used)").draggable({
    revert: "invalid",
    helper: "clone"
  });
}

// Mark used Rules in definition
function  rrules_mark_used_rule(rule_id) {
  $("#rrules_rule_id_" + rule_id + " .rrules_used_hint").remove();
  $("#rrules_rule_id_" + rule_id).removeClass("rrules_type_definition ui-draggable ui-draggable-handle").addClass("rrules_type_definition_used");
  $("#rrules_rule_id_" + rule_id + " .rrules_rule_id").after( "<span class='rrules_used_hint'>(used)</span>" );  
}

// Hover event on Rule item
function rrules_rule_hover() {
  // Show the Rule id and name of the hovered Rule
  $(".rrules_rule_id_label").text($(this).find(".rrules_rule_id").text());
  $(".rrules_rule_hint").hide();
  $(".rrules_rule_name").text($(this).attr("data-rule-name")).removeClass("hidden").show();
}

// Unhover event on Rule item
function rrules_rule_unhover() {
  if($(".rrules_rule_name_label").hasClass("active") === true) {
    $(".rrules_rule_id_label").text($(".rrules_rule_item.selected .rrules_rule_id").text());
    $(".rrules_rule_name").text($(".rrules_rule_item.selected").attr("data-rule-name")).removeClass("hidden").show();
  }else{
    $(".rrules_rule_id_label").text("");
    $(".rrules_rule_name").hide();    
  }
}

// Reset the Rule info panel
function rrules_rule_info_reset() {
  if($(".rrules_rule_name_label").hasClass("active") === true) {
    $(".rrules_rule_id_label").text($(".rrules_rule_item.selected .rrules_rule_id").text());
    $(".rrules_rule_name").text($(".rrules_rule_item.selected").attr("data-rule-name")).removeClass("hidden").show();    
  }else{
    $(".rrules_rule_id_label").text("Rule Info");
    $(".rrules_rule_hint").show();
    $(".rrules_rule_name").hide();   
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

// Remove used Rule
function rrules_remove_used_rule(element) {
  var id = element.attr("id").replace("rrules_used_rule_id_", "");
  $("#rrules_rule_id_" + id).addClass("new rrules_type_definition").removeClass("rrules_type_definition_used");
  $("#rrules_rule_id_" + id + " .rrules_used_hint").text("");
  // Delete used Rule
  element.remove();
  if(element.hasClass("selected") === true) {
    // Clear Rule selection
    $(".rrules_rule_item.selected").removeClass("selected");
    // Reset Rule info panel
    $(".rrules_rule_name_label").removeClass("active");
  }
  rrules_rule_info_reset();
  // Load events on newly cloned elements
  rrules_load_rules_events();
}
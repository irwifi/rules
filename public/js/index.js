var default_group = 1, loading_count = 0;

$(function() {
    // Load the rules,  Default Group Id = 1
    rrules_load_rules(true, default_group);

    // Drop Rules to used rule area
    rrules_drop_to_used();

    // Drop Rules to rule definition
    rrules_drop_to_definition();

    // Add edit rule
    rrules_add_edit_rule();

    // Load Toastr alert
    rrules_toastr();
});

// Load Rule Group list
function rrules_load_group_list(group_id) {
    $(".rrules_group_list_panel").hide();
    if($(".rrules_group_list").children().length === 1) {
        var active = "";
        // Get Rule Groups from the URL link
        $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleGroups", function(groups) {
            $.each(groups, function(key, value) {
                if(value.ID === group_id) {active = ' class="active"'};
                $(".rrules_group_list").append("<div data-id='" + value.ID + "'" + active + ">" + value.Name + "</div>");
                active = "";
            });
        });
    }
}

// Reload Rule Group
function rrules_reload_group(group_id) {
    if(group_id === 0) {
        group_id = $(".rrules_group_list div.active").attr("data-id");
    }

    // Show loading overlay
    rrules_show_loading(2, 1)

    $(".rrules_group_list div.active").removeClass("active");
    $(".rrules_group_list div[data-id='"+group_id+"']").addClass("active");
    $(".rrules_rules_box div:not(.rrules_rules_title)").remove();
    $(".rrules_group_severity select").empty(); // so that same options are not added every time
    // Load the rules of Group
    rrules_load_rules(false, group_id);
}

// Load the rules
function rrules_load_rules(first_load, group_id) {
    // Load Rule Group list
    rrules_load_group_list(group_id);

    // Show loading overlay
    rrules_show_loading(2, 1)

    // Get Rule details from the URL link
    $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRules", function(rules) {
        $.each(rules, function(key, value) {
            // Load Rule definitions, Clone each Rule item and apply Id and Name to that item
            $("#rrules_rule_sample").clone().attr({ "id": "rrules_rule_id_" + value.ID, "data-rule-id": value.ID, "data-rule-name": value.Name, "data-rule-desc": value.Description }).addClass("new rrules_type_definition").removeClass("hidden").appendTo(".rrules_rules_definition .rrules_rules_box");
            $("#rrules_rule_id_" + value.ID + " .rrules_rule_name").text(value.Name);
        });

        // Load the rule group
        rrules_load_rule_group(first_load, group_id);
    });
}

// Load the rule group
function rrules_load_rule_group(first_load, group_id) {
    // Load Rule Group details
    $.getJSON("http://tbc.etracinc.com:247/AIS/GetRuleGroupInfo?GroupID=" + group_id, function(data) {
        // Get Rule Group Severity from the URL link
        $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleSeverity", function(severity) {
            $.each(severity, function(key, value) {
                var option_html = "<option value='" + value.ID + "'";
                if (value.ID === data.Severity) {
                    option_html = option_html + ' selected = "selected"';
                    $(".rrules_group_info_severity").text("(" + value.Name + ")");
                    $(".rrules_group_severity").attr("data-id", value.ID);
                }
                option_html = option_html + ">" + value.Name + "</option>";
                $(".rrules_group_severity select").append(option_html);
            });
            // Close loading overlay
            rrules_close_loading();
        });

        $(".rrules_group_info").show();
        $(".rrules_group_edit").removeClass("add_new").hide();
        $(".rrules_group_label").attr({ "data-id": group_id })
        $(".rrules_group_info_name").text(data.Name);
        $(".rrules_group_name input").val(data.Name);

        if(first_load === true) {
            // Load Rule Group events
            rrules_group_events();
        }

        // Add New Rule Button
        rrules_add_rule_button()

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
        var rule_name = $("#rrules_rule_id_" + id).attr("data-rule-name");
        var rule_desc = $("#rrules_rule_id_" + id).attr("data-rule-desc");
        $("#rrules_rule_sample").clone().attr({ "id": "rrules_used_rule_id_" + id, "data-rule-id": id, "data-rule-name": rule_name, "data-rule-desc": rule_desc }).addClass("new rrules_type_used").removeClass("hidden").appendTo(".rrules_rules_used .rrules_rules_box");
        $("#rrules_used_rule_id_" + id + " .rrules_rule_name").text(rule_name);

        // Mark used Rule in definition
        // rrules_mark_used_rule(id);

        // Hide used Rule in definition
        rrules_hide_used_rule(id);
    });

    // Close loading overlay
    rrules_close_loading();
}

// Mark used Rule in definition
function rrules_mark_used_rule(rule_id) {
    $("#rrules_rule_id_" + rule_id).removeClass("rrules_type_definition ui-draggable ui-draggable-handle").addClass("rrules_type_definition_used");
    $("#rrules_rule_id_" + rule_id + " .rrules_used_hint").text("(used)");

    // Hide Rule instead of marking
    // rrules_hide_used_rule(rule_id);
}

// Hide used Rule in definition
function rrules_hide_used_rule(rule_id) {
    $("#rrules_rule_id_" + rule_id).removeClass("rrules_type_definition ui-draggable ui-draggable-handle").addClass("rrules_type_definition_used hidden");
}

// Add New Rule Button
function rrules_add_rule_button() {
    $("#rrules_rule_sample").clone().addClass("add_new_rule").removeClass("hidden").empty().appendTo(".rrules_rules_box.sortable2");
    $(".add_new_rule").append('<i class="fa fa-plus-circle" aria-hidden="true"></i>').off();
    $(".add_new_rule").on("click", function() {$('#edit_rule_modal').modal('show');});
}

// Load Rule events
function rrules_load_rules_events() {
    // Clear existing events
    $(".rrules_rule_item.new").off();
    $(".rrules_rule_item.new .rrules_rule_delete").off();

    // Hover and unhover events on Rule item
    $(".rrules_rule_item.new").hover(rrules_rule_hover, rrules_rule_unhover);
    // Click the Rule to select it
    $(".rrules_rule_item.new").on("click", function() { rrules_toggle_rule_select($(this)); });

    // Delete Rule from used Rule
    $(".rrules_rules_used .rrules_rule_item.new .rrules_rule_delete").on("click", function(event) {
        // Stop Rule selection
        event.stopPropagation();

        var element = $(this).closest(".rrules_rule_item");
        rrules_remove_used_rule(element);
    });

    // Delete Rule from Rule definition
    $(".rrules_rules_definition  .rrules_rule_item.new .rrules_rule_delete").on("click", function(event) {
        // Stop Rule selection
        event.stopPropagation();

        var element = $(this).closest(".rrules_rule_item");
        var rule_id = element.attr("data-rule-id");

        $("#dialog_modal").modal();
        $("#dialog_modal .modal-body").text("Are you sure you want to delete this Rule?");

        $("#dialog_modal .btn_yes").off();
        $("#dialog_modal .btn_yes").on("click", function() {
            // Delete Rule Groups
            $.getJSON("http://tbc.etracinc.com:247/ais/removerule?RuleID=" + rule_id, function(data) { });

            $('#dialog_modal').modal('hide');
            element.remove();
            if (element.hasClass("selected") === true) {
                // Reset Rule info panel
                $(".rrules_rule_name_label").removeClass("active");
            }
            rrules_rule_unhover();
            toastr.success('Rule Successfully Deleted.', 'Success Alert', {});
        });
    });

    // Remove class .new from New items
    $(".new").removeClass("new");
}

// Load Rule Group events
function rrules_group_events() {
    // Select Rule Group from the dropdown
    $(".rrules_group_list div").on("click", function() {rrules_reload_group($(this).attr("data-id"));});

    // Edit Group button
    $(".rrules_group_info_edit input").on("click", rrules_group_info_toggle);

    // New Group button
    $(".rrules_group_info_new input").on("click", rrules_new_group);

    // Cancel Group add edit
    $(".rrules_group_cancel input").on("click", rrules_cancel_group );

    // Save Group add edit
    $(".rrules_group_submit input").on("click", rrules_add_edit_group);

    // Delete Group
    $(".rrules_group_info_delete input").on("click", rrules_group_delete);

    // Toggle Group list
    $(".rrules_group_arrow").on("click", function() {
        $(".rrules_group_list_panel").toggle();
    });

    // Close Group list on Group button click
    $(".rrules_group_list, .rrules_group_buttons").on("click", function() {
        $(".rrules_group_list_panel").hide();
    });
}

// Hover event on Rule item
function rrules_rule_hover() {
    var description_html = "";
    var description = $(this).attr("data-rule-desc").split('\\n');

    $.each(description, function (index, value) {
        description_html = description_html + '<div>' + value + '</div>'
    });

    // Show the Rule id and name of the hovered Rule
    $(".rrules_rule_info_name").text($(this).find(".rrules_rule_name").text()).addClass("on");
    $(".rrules_rule_hint").html(description_html);
}

// Unhover event on Rule item
function rrules_rule_unhover() {
    if ($(".rrules_rule_name_label").hasClass("active") === true) {
        $(".rrules_rule_info_name").text($(".rrules_rule_item.selected:eq(0) .rrules_rule_name").text()).removeClass("on");
        // $(".rrules_rule_hint").text("(" + $(".rrules_rule_item.selected").attr("data-rule-desc") + ")");
    } else {
        $(".rrules_rule_info_name").text("Rule Info").removeClass("on");
        $(".rrules_rule_hint").text("");
    }
}

// Toggle Rule selection
function rrules_toggle_rule_select(element) {
    if (element.hasClass("selected") === true) {
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
    $(".sortable1, .sortable2").sortable({
        revert: true,
        helper: "clone"
    });
}

// Drop Rules to used rule area
function rrules_drop_to_used() {
    $(".rrules_rules_used .rrules_rules_box").droppable({
        accept: ".rrules_type_definition",
        drop: function(event, ui) {
            var rule_id = $(ui.helper).attr("id").replace("rrules_rule_id_", "");
            $(ui.helper).clone().attr("id", "rrules_used_rule_id_" + rule_id).addClass("new rrules_type_used").removeClass("rrules_type_definition ui-draggable ui-draggable-handle ui-draggable-dragging").removeAttr("style").appendTo($(this));
            $(ui.helper).remove();

            // Mark used Rule in definition
            // rrules_mark_used_rule(rule_id);

            // Hide used Rule in definition
            rrules_hide_used_rule(rule_id);

            // Load Rule events
            rrules_load_rules_events();

            var group_id = $(".rrules_group_label").attr("data-id");
            // URL to Insert Rule to Group
            $.getJSON("http://tbc.etracinc.com:247/AIS/AddNewRuleToRuleGroup?GroupID=" + group_id + "&RuleID=" + rule_id + "&Order=2", function(result) {
            });
        }
    });
}

// Drop Rules to rule definition
function rrules_drop_to_definition() {
    $(".rrules_rules_definition .rrules_rules_box").droppable({
        accept: ".rrules_type_used",
        drop: function(event, ui) {
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
    if (element.hasClass("selected") === true) {
        // Clear Rule selection
        $(".rrules_rule_item.selected").removeClass("selected");
        // Reset Rule info panel
        $(".rrules_rule_name_label").removeClass("active");
    }
    // Delete used Rule
    element.remove();
    rrules_rule_unhover();

    var group_id = $(".rrules_group_label").attr("data-id");
    // URL to Delete Rule from Group
    $.getJSON("http://tbc.etracinc.com:247/AIS/RemoveRuleFromRuleGroup?GroupID=" + group_id + "&RuleID=" + id, function(result) {
    });
}

// Show loading overlay
function rrules_show_loading(load_count, opacity) {
    loading_count = load_count;
    $(".loader").show();
    $(".loading_overlay").css({"opacity": 1});
}

// Close loading overlay
function rrules_close_loading() {
    loading_count--;
    if(loading_count < 1) {
        $(".loader").css({"opacity": 1}).fadeOut();
    }
}

function rrules_group_info_toggle() {
    $(".rrules_group_info").hide();
    $(".rrules_group_edit").show();
}

// Cancel Group add/edit
function rrules_cancel_group() {
    $(".rrules_group_info").show();
    $(".rrules_group_edit").hide();

    if($(".rrules_group_edit").hasClass("add_new")) {
        var current_group_id = $(".rrules_group_label").attr("data-id");
        $(".rrules_group_label").attr({"data-id": 0});
        rrules_reload_group(current_group_id);
    } else {
        $(".rrules_group_name input").val($(".rrules_group_info_name").text());
        $(".rrules_group_severity select").val($(".rrules_group_severity").attr("data-id"));
    }
}

// Rule Group add/edit
function rrules_add_edit_group() {
    var err = 0;
    var group_id = $(".rrules_group_label").attr("data-id");
    var group_name = $(".rrules_group_name input").val();
    var group_severity = $(".rrules_group_severity select").val();
    if(group_name.trim() === "") {
        toastr.error('Rule Group name is blank.', 'Error Alert', {});
        err = 1;
    }

    if(isNaN(parseInt(group_severity))) {
        toastr.error('Rule Group severity is blank.', 'Error Alert', {});
        err = 1;
    }

    if(err === 1) {
        return 0;
    }

    // Show loading overlay
    rrules_show_loading(0, 0.5);

    var severity_name;
    $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleSeverity", function(severity) {
        $.each(severity, function(key, value) {
            if(parseInt(value.ID) === parseInt(group_severity)) {
                severity_name = value.Name;

                if($(".rrules_group_edit").hasClass("add_new")) {
                    // Show loading overlay
                    rrules_show_loading(2, 1);

                    // Add new Rule Group
                    $(".rrules_group_edit").removeClass("add_new");

                    var new_id = default_group;
                    $.getJSON("http://tbc.etracinc.com:247/AIS/CreateNewRuleGroup", function(data) {
                        new_id = data.NewIndex;
                         $.getJSON("http://tbc.etracinc.com:247/ais/updaterulegroupname?GroupID=" + new_id + "&Name=" + group_name + "&Severity=" + group_severity, function(result) { });
                         rrules_reload_group(new_id);
                         toastr.success('New Rule Group Successfully Added.', 'Success Alert', {});
                          $( ".rrules_group_cancel input" ).trigger( "click" );
                         $(".rrules_group_list").append('<div data-id="' + new_id + '" class="active">' + group_name + '</div>');
                         $(".rrules_group_list div[data-id='" + new_id + "']").on("click", function() {rrules_reload_group($(this).attr("data-id"));});
                    });
                } else {
                    // Update Rule Group detail
                    $.getJSON("http://tbc.etracinc.com:247/ais/updaterulegroupname?GroupID=" + group_id + "&Name=" + group_name + "&Severity=" + group_severity, function(result) {  });
                    $(".rrules_group_info_name").text(group_name);
                    $(".rrules_group_name input").val(group_name);
                    $(".rrules_group_severity select").val(group_severity);
                    $(".rrules_group_info_severity").text("(" + severity_name + ")");
                    $( ".rrules_group_cancel input" ).trigger( "click" );
                    rrules_close_loading();
                    toastr.success('Rule Group Detail Successfully Updated.', 'Success Alert', {});
                }
                return false;
            }
        });
    });
}

// Rule Group delete
function rrules_group_delete() {
    var group_id = $(".rrules_group_label").attr("data-id");
    $("#dialog_modal").modal();
    $("#dialog_modal .modal-body").text("Are you sure you want to delete this Rule Group?");

    $("#dialog_modal .btn_yes").off();
    $("#dialog_modal .btn_yes").on("click", function() {
        // Show loading overlay
        rrules_show_loading(2, 1);
        // Delete Rule Groups
        $.getJSON("http://tbc.etracinc.com:247/ais/removerulegroup?GroupID=" + group_id, function(data) { });

        $('#dialog_modal').modal('hide');
        $(".rrules_group_list div.active").remove();
        rrules_reload_group(default_group);
        toastr.success('Rule Group Successfully Deleted.', 'Success Alert', {});
    });
}

// New rule group
function rrules_new_group() {
    $(".rrules_group_info").hide();
    $(".rrules_group_edit").show();
    $(".rrules_group_edit").addClass("add_new");
    $(".rrules_rules_box div:not(.rrules_rules_title)").remove();
    $(".rrules_group_name input").val("");
    $(".rrules_group_severity select").val("");
}

// Add edit rule
function rrules_add_edit_rule() {
    // On Edit Rule modal load
    $('#edit_rule_modal').on('show.bs.modal', function(e) {
        rrules_show_loading(2, 0.9);

        var $trigger = $(e.relatedTarget);
        var rule_id = $trigger.closest(".rrules_rule_item").attr("data-rule-id");
        var rule_name, type_id, comparison_id, condition_id, condition;
        var new_rule_name, new_type_id, new_comparison_id, new_condition_id, new_condition;

        if(rule_id !== undefined) {
            // Get Rule info
            $.getJSON("http://tbc.etracinc.com:247/ais/Getruleinfo?RuleID=" + rule_id, function(data) {
                rule_name = data.Name;
                type_id = data.typeID;
                comparison_id = data.ComparisonID;
                condition_id = data.ConditionID;
                condition = data.Condition;

                $("#edit_rule_modal .modal-title").text("Edit Rule");
                $(".rrules_edit_rule_name_row input").attr("data-rule-id", rule_id).val(rule_name);
                $(".rrules_edit_rule_value_row select").empty();
                // Load all Rule types
                rrules_load_rule_type(type_id, comparison_id, condition_id, condition);
            });
        } else {
            $("#edit_rule_modal .modal-title").text("Add New Rule");
            $(".rrules_edit_rule_name_row input").removeAttr("data-rule-id");
            $(".rrules_edit_rule_value_row select").empty();
            $(".rrules_edit_rule_value_row input").val("");
            // Load all Rule types
            rrules_load_rule_type(null, comparison_id, condition_id, condition);
        }
     });

    // Change rule type
    rrules_change_rule_type();
    // Submit rule edit
    rrules_submit_rule_edit();
}

// Load all Rule types
function rrules_load_rule_type(type_id, comparison_id, condition_id, condition) {
    var option_selected = "";
    $.getJSON("http://tbc.etracinc.com:247/AIS/GetAllRuleTypes", function(type) {
        $.each(type, function(key, value) {
            if(value.ID === type_id) {
                option_selected = "selected='selected'";
            }
            $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").append("<option value='" + value.ID + "' " + option_selected + ">" + value.Name + "</option>");
            option_selected = "";
        });

        if(type_id === null) {
            $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").val($(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type'] option:eq(0)").attr("value"));
            type_id =  $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").val();
        }

        // Load rule criteria
        rrules_load_rule_criteria(type_id, comparison_id);
        // Load rule value
        rrules_load_rule_value(type_id, condition_id, condition);
    });
}

// Load rule criteria
function rrules_load_rule_criteria(type_id, comparison_id) {
    var option_selected = "";
    $.getJSON("http://tbc.etracinc.com:247/ais/getrulecomparison?TypeID=" + type_id, function(criteria) {
        $.each(criteria, function(key, value) {
            if(value.ID === comparison_id) {
                option_selected = "selected='selected'";
            }
            $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_criteria']").append("<option value='" + value.ID + "' " + option_selected + ">" + value.Name + "</option>");
            option_selected = "";
        });
        rrules_close_loading();
    });
}

// Load rule value
function rrules_load_rule_value(type_id, condition_id, condition) {
    $.getJSON("http://tbc.etracinc.com:247/ais/getrulevalues?TypeID=" + type_id, function(result) {
        if(result.length > 0) {
            var option_selected = "";
            $(".rrules_edit_rule_value").siblings("select").show();
            $(".rrules_edit_rule_value").siblings("input").val("").hide();

            $.each(result, function(key, value) {
                if(value.ID === condition_id) {
                    option_selected = "selected='selected'";
                }
                $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_value']").append("<option value='" + value.ID + "' " + option_selected + ">" + value.Name + "</option>");
                option_selected = "";
            });
        } else {
            $(".rrules_edit_rule_value").siblings("select[name='rrules_edit_rule_value']").val(0).hide();
            $(".rrules_edit_rule_value").siblings("input").val(condition).show();
        }
        rrules_close_loading();
    });
}

// Change rule type
function rrules_change_rule_type() {
    $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").on("change", function() {
        var type_id = $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").val();

        $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_criteria']").empty();
        $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_value']").empty();
        rrules_load_rule_criteria(type_id, 0);
        rrules_load_rule_value(type_id, 0, "");
    });
}

// Submit rule edit
function rrules_submit_rule_edit() {
    $("#edit_rule_modal .btn_submit").off();
    $("#edit_rule_modal .btn_submit").on("click", function() {
        // Show loading overlay
        rrules_show_loading(0, 1);

        var rule_id = $(".rrules_edit_rule_name_row input").attr("data-rule-id");
        var new_rule_name = $(".rrules_edit_rule_name_row input").val();
        var new_type_id = $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").val();
        var new_comparison_id = $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_criteria']").val();
        var new_condition_id = $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_value']").val();
        var new_condition = $(".rrules_edit_rule_value_row input").val().trim();
        var desc_rule = 1;
        var desc_criteria = 1;
        var desc_condition = 1;
        var new_rule_desc = "Rule: " + $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type'] option[value='" + new_type_id + "']").text() + "\\nCriteria: " + $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_criteria'] option[value='" + new_comparison_id + "']").text() + "\\nCondition: ";
        if(new_condition_id === null) {
            new_rule_desc = new_rule_desc + new_condition;
            if(new_condition === "") {
                toastr.error("Condition is empty.", 'Error Alert', {});
                rrules_close_loading();
                return false;
            }
        } else {
            new_rule_desc = new_rule_desc + $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_value'] option[value='" + new_condition_id + "']").text();
        }

        var toastr_msg;
        if(rule_id !== undefined) {
             // Edit Rule
             $.getJSON("http://tbc.etracinc.com:247/ais/updaterule?RuleID=" + rule_id + "&Name=" + new_rule_name + "&TypeID=" + new_type_id + "&ComparisonID=" + new_comparison_id + "&ConditionID=" + new_condition_id + "&CustomCondition=" + new_condition, function(data) { });
             $(".rrules_rule_item[data-rule-id=" + rule_id + "]").attr({"data-rule-name": new_rule_name, "data-rule-desc": new_rule_desc}).find(".rrules_rule_name").text(new_rule_name);
             toastr_msg = 'Rule Detail Successfully Edited.';
        } else {
            // Add New Rule
            $.getJSON("http://tbc.etracinc.com:247/ais/createNewRule", function(data) {
                var new_id = data.NewIndex;
                $.getJSON("http://tbc.etracinc.com:247/ais/updaterule?RuleID=" + new_id + "&Name=" + new_rule_name + "&TypeID=" + new_type_id + "&ComparisonID=" + new_comparison_id + "&ConditionID=" + new_condition_id + "&CustomCondition=" + new_condition, function(data) { });

                $("#rrules_rule_sample").clone().attr({ "id": "rrules_rule_id_" + new_id, "data-rule-id": new_id, "data-rule-name": new_rule_name, "data-rule-desc": new_rule_desc }).addClass("rrules_type_definition").removeClass("hidden").insertBefore(".add_new_rule");
                $("#rrules_rule_id_" + new_id + " .rrules_rule_name").text(new_rule_name);
                // $("").on("click", function() {});
            });
            toastr_msg = 'New Rule Added Successfully.';
        }

        $('#edit_rule_modal').modal('hide');
        toastr.success(toastr_msg, 'Success Alert', {});
        rrules_close_loading();
    });
}

// Toaster alert messages
function rrules_toastr() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "positionClass": "toast-top-right",
        "showDuration": "10000",
        "hideDuration": "1000",
        "timeOut": "8000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    // toastr.success('Success Message.', 'Success Alert', {}); //options in { }, types = success, info, error, warning
}
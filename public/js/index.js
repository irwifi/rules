var gid = 0, loading_count = 0;

$(function() {
    // Load Rule functions
    rrules_rule_functions();

    // Load email functions
    rrules_email_functions();

    // Load Toastr alert
    rrules_toastr();
});

// Load rule functions
function rrules_rule_functions() {
    // Load the rules
    rrules_load_rules(true, gid);

    // Drop Rules to used rule area
    rrules_drop_to_used();

    // Drop Rules to rule definition
    rrules_drop_to_definition();

    // Add edit rule
    rrules_add_edit_rule();
}

// Load the rules
function rrules_load_rules(first_load, group_id) {
    // Load Rule Group list
    rrules_load_group_list(group_id);

    // Show loading overlay
    rrules_show_loading(2, 1)

    // Get Rule details from the URL link
    $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllRules", function(rules) {
        var counter = 0;
        $.each(rules, function(key, value) {
            // Load Rule definitions, Clone each Rule item and apply Id and Name to that item
            $("#rrules_rule_sample").clone().attr({ "id": "rrules_rule_id_" + value.ID, "data-rule-id": value.ID, "data-rule-name": value.Name, "data-rule-desc": value.Description }).addClass("new rrules_type_definition").removeClass("hidden").appendTo(".rrules_rules_definition .rrules_rules_box");
            $("#rrules_rule_id_" + value.ID + " .rrules_rule_name").text(value.Name);
            if(value.Locked === 1) {
                $("#rrules_rule_id_" + value.ID + " .rrules_rule_lock").show();
                $("#rrules_rule_id_" + value.ID).addClass("locked");
            }
            counter++;
            if(counter === rules.length) {
                // Load the rule group
                setTimeout(rrules_load_rule_group, 100, first_load, group_id );
            }
        });
    });
}

// Load Rule Group list
function rrules_load_group_list(group_id) {
    $(".rrules_group_list_panel").hide();
    if($(".rrules_group_list").children().length === 1) {
        var active = "";
        // Get Rule Groups from the URL link
        $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllRuleGroups", function(groups) {
            $.each(groups, function(key, value) {
                if(gid === 0) {
                    if(group_id === 0) {group_id = value.ID;}
                    gid = group_id;
                }
                if(value.ID === group_id) {
                    active = ' class="active"';
                }
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
    $(".rrules_email_box div:not(.rrules_email_title)").remove();
    $(".rrules_group_severity select").empty(); // so that same options are not added every time
    // Load the rules
    rrules_load_rules(false, group_id);
    // Load emails
    rrules_load_emails();
}

// Load the rule group
function rrules_load_rule_group(first_load, group_id) {
    if(first_load === true) {
        group_id = gid;
    }

    // Load Rule Group details
    $.getJSON("https://tbc.etracinc.com:248/AIS/GetRuleGroupInfo?GroupID=" + group_id, function(data) {
        // Check locked status
        if(data.Locked === 1) {
            $(".rrules_group_info_locked").removeClass("group_unlocked").addClass("group_locked");
            $(".rrules_group_info_edit, .rrules_group_info_delete").hide();
            $(".rrules_rules_area").addClass("locked");
        } else {
            $(".rrules_group_info_locked").removeClass("group_locked").addClass("group_unlocked");
            $(".rrules_group_info_edit, .rrules_group_info_delete").show();
            $(".rrules_rules_area").removeClass("locked");
        }

        // Get Rule Group Severity from the URL link
        $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllRuleSeverity", function(severity) {
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

        // Load used emails
        rrules_load_used_emails(data.EmailID);

        // Load email events
        rrules_load_email_events();

        // Initiate the draggable elements
        if($(".rrules_rules_area").hasClass("locked") === false) {
            rrules_init_sortable();
        } else {
            $(".sortable1, .sortable2, .sortable3, .sortable4").sortable();
            $(".sortable1, .sortable2, .sortable3, .sortable4").sortable("destroy");
        }
    });
}

// Load used Rules
function rrules_load_used_rules(used_rules) {
    $.each(used_rules, function(key, id) {
        var rule_name = $("#rrules_rule_id_" + id).attr("data-rule-name");
        var rule_desc = $("#rrules_rule_id_" + id).attr("data-rule-desc");
        $("#rrules_rule_sample").clone().attr({ "id": "rrules_used_rule_id_" + id, "data-rule-id": id, "data-rule-name": rule_name, "data-rule-desc": rule_desc }).addClass("new rrules_type_used").removeClass("hidden").appendTo(".rrules_rules_used .rrules_rules_box");
        $("#rrules_used_rule_id_" + id + " .rrules_rule_name").text(rule_name);

        if($("#rrules_rule_id_" + id + " .rrules_rule_lock").is(":visible") === true) {
            $("#rrules_used_rule_id_" + id + " .rrules_rule_lock").show();
        } else {
            $("#rrules_used_rule_id_" + id + " .rrules_rule_lock").hide();
        }

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
        if($(".rrules_rules_area").hasClass("locked") === false) {
            // Stop Rule selection
            event.stopPropagation();

            var element = $(this).closest(".rrules_rule_item");
            rrules_remove_used_rule(element);
        }
    });

    // Delete Rule from Rule definition
    $(".rrules_rules_definition  .rrules_rule_item.new .rrules_rule_delete").on("click", function(event) {
        var element = $(this).closest(".rrules_rule_item");
        var rule_id = element.attr("data-rule-id");

        if($(".rrules_rules_area").hasClass("locked") === false && $("#rrules_rule_id_"+rule_id).hasClass("locked") === false) {
            // Stop Rule selection
            event.stopPropagation();

            $("#dialog_modal").modal();
            $("#dialog_modal .modal-body").text("Are you sure you want to delete this Rule?");

            $("#dialog_modal .btn_yes").off();
            $("#dialog_modal .btn_yes").on("click", function() {
                rrules_show_loading(0,1);
                // Delete Rule Groups
                $.getJSON("https://tbc.etracinc.com:248/ais/removerule?RuleID=" + rule_id).always(function(data) {
                    $('#dialog_modal').modal('hide');
                    if(data.responseText === "Ok") {
                        element.remove();
                        if (element.hasClass("selected") === true) {
                            // Reset Rule info panel
                            $(".rrules_rule_name_label").removeClass("active");
                        }
                        rrules_rule_unhover();
                        toastr.success('Rule Successfully Deleted.', 'Success Alert', {});
                    } else {
                        toastr.error('Rule cannot be deleted because it is in use by other Rule.', 'Error Alert', {});
                    }
                    rrules_close_loading();
                });
            });
        }
    });

    // Remove class .new from New items
    $(".rrules_rule_item.new").removeClass("new");
}

// Lock Toggle
function rrules_lock_toggle(location, action) {
    var locked_state, class_name
    var locked_check = true;
    if(action === "hover") {locked_check = !locked_check;}
    if(location === "group") {
        class_name = ".rrules_group_info_locked";
        locked_state = $(class_name).hasClass("group_locked");
    } else {
        class_name = ".rrules_edit_lock";
        locked_state = $(class_name).hasClass("rule_locked");
    }
    if(locked_state === locked_check) {
        $(class_name + " .lock_locked").show();
        $(class_name + " .lock_unlocked").hide();
    } else {
        $(class_name + " .lock_locked").hide();
        $(class_name + " .lock_unlocked").show();
    }
}

// Load Rule Group events
function rrules_group_events() {
    // Select Rule Group from the dropdown
    $(".rrules_group_list div").on("click", function() {rrules_reload_group($(this).attr("data-id"));});

    // Group Lock hover, unhover
    $(".rrules_group_info_locked").hover(
        function() {
            rrules_lock_toggle("group", "hover");
        },
        function() {
            rrules_lock_toggle("group", "unhover");
        }
    );

    // Lock click
    $(".rrules_group_info_locked .lock_locked").on("click", function() {rrules_group_lock_unlock(1);});

    // Unlock click
    $(".rrules_group_info_locked .lock_unlocked").on("click", function() {rrules_group_lock_unlock(0);});

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

// Lock unlock Groupand Rule
function rrules_rule_lock_unlock(rule_id, action) {
    if(action === "lock") {
        action = 1;
    } else {
        action = 0;
    }
    $.getJSON("https://tbc.etracinc.com:248/AIS/updateRuleLocked?RuleID=" + rule_id + "&Locked=" + action, function(data) {
    });

    if( action === 1 ) {
        $(".rrules_edit_lock").removeClass("rule_unlocked").addClass("rule_locked");
        $(".rrules_edit_lock .lock_locked").show();
        $(".rrules_edit_lock .lock_unlocked").hide();
        $("#edit_rule_modal input, #edit_rule_modal select, #edit_rule_modal .btn_submit").attr("disabled", "disabled");
        $("#rrules_rule_id_" + rule_id + " .rrules_rule_lock").show();
        $("#rrules_used_rule_id_" + rule_id + " .rrules_rule_lock").show();
        $("#rrules_rule_id_" + rule_id).addClass("locked");
        toastr_msg = 'Rule Locked';
    } else {
        $(".rrules_edit_lock").removeClass("rule_locked").addClass("rule_unlocked");
        $(".rrules_edit_lock .lock_locked").hide();
        $(".rrules_edit_lock .lock_unlocked").show();
        $("#edit_rule_modal input, #edit_rule_modal select, #edit_rule_modal .btn_submit").removeAttr("disabled");
        $("#rrules_rule_id_" + rule_id + " .rrules_rule_lock").hide();
        $("#rrules_used_rule_id_" + rule_id + " .rrules_rule_lock").hide();
        $("#rrules_rule_id_" + rule_id).removeClass("locked");
        toastr_msg = 'Rule Unlocked';
    }

    toastr.success(toastr_msg, 'Success Alert', {});
}

// Lock unlock group
function rrules_group_lock_unlock(action) {
    var group_id = $(".rrules_group_label").attr("data-id");
    $.getJSON("https://tbc.etracinc.com:248/AIS/updateRuleGroupLocked?GroupID=" + group_id + "&Locked=" + action, function(data) {
    });

    $(".rrules_group_info_edit, .rrules_group_info_delete").toggle();

    if( action === 1 ) {
        $(".rrules_rules_area").addClass("locked");
        $(".rrules_group_info_locked").removeClass("group_unlocked").addClass("group_locked");
        toastr_msg = 'Group Locked';
    } else {
        $(".rrules_rules_area").removeClass("locked");
        $(".rrules_group_info_locked").removeClass("group_locked").addClass("group_unlocked");
        toastr_msg = 'Group Unlocked';
    }

    if($(".rrules_rules_area").hasClass("locked") === false) {
        rrules_init_sortable();
    } else {
        $(".sortable1, .sortable2, .sortable3, .sortable4").sortable("destroy");
    }

    toastr.success(toastr_msg, 'Success Alert', {});
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
    $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllRuleSeverity", function(severity) {
        $.each(severity, function(key, value) {
            if(parseInt(value.ID) === parseInt(group_severity)) {
                severity_name = value.Name;

                if($(".rrules_group_edit").hasClass("add_new")) {
                    // Show loading overlay
                    rrules_show_loading(2, 1);

                    // Add new Rule Group
                    $(".rrules_group_edit").removeClass("add_new");

                    var new_id;
                    $.getJSON("https://tbc.etracinc.com:248/AIS/CreateNewRuleGroup", function(data) {
                        new_id = data.NewIndex;
                         $.getJSON("https://tbc.etracinc.com:248/ais/updaterulegroupname?GroupID=" + new_id + "&Name=" + group_name + "&Severity=" + group_severity, function(result) { });
                         rrules_reload_group(new_id);
                         toastr.success('New Rule Group Successfully Added.', 'Success Alert', {});
                          $( ".rrules_group_cancel input" ).trigger( "click" );
                         $(".rrules_group_list").append('<div data-id="' + new_id + '" class="active">' + group_name + '</div>');
                         $(".rrules_group_list div[data-id='" + new_id + "']").on("click", function() {rrules_reload_group($(this).attr("data-id"));});
                    });
                } else {
                    // Update Rule Group detail
                    $.getJSON("https://tbc.etracinc.com:248/ais/updaterulegroupname?GroupID=" + group_id + "&Name=" + group_name + "&Severity=" + group_severity, function(result) {  });
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
        $.getJSON("https://tbc.etracinc.com:248/ais/removerulegroup?GroupID=" + group_id, function(data) { });

        $('#dialog_modal').modal('hide');
        $(".rrules_group_list div.active").remove();
        rrules_reload_group(0);
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
            $.getJSON("https://tbc.etracinc.com:248/ais/Getruleinfo?RuleID=" + rule_id, function(data) {
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

                $(".rrules_edit_lock").show();
                if(data.Locked === 1)  {
                    $(".rrules_edit_lock").removeClass("rule_unlocked").addClass("rule_locked");
                    $(".rrules_edit_lock .lock_locked").show();
                    $(".rrules_edit_lock .lock_unlocked").hide();
                    $("#edit_rule_modal input, #edit_rule_modal select, #edit_rule_modal .btn_submit").attr("disabled", "disabled");
                } else {
                    $(".rrules_edit_lock").removeClass("rule_locked").addClass("rule_unlocked");
                    $(".rrules_edit_lock .lock_locked").hide();
                    $(".rrules_edit_lock .lock_unlocked").show();
                    $("#edit_rule_modal input, #edit_rule_modal select, #edit_rule_modal .btn_submit").removeAttr("disabled");
                }

                // Group Lock hover, unhover
                $(".rrules_edit_lock").hover(
                    function() {
                        rrules_lock_toggle("rule", "hover");
                    },
                    function() {
                        rrules_lock_toggle("rule", "unhover");
                    }
                );

                // Lock click
                $(".rrules_edit_lock .lock_locked").off();
                $(".rrules_edit_lock .lock_locked").on("click", function() {rrules_rule_lock_unlock(rule_id, "lock");});

                // Unlock click
                $(".rrules_edit_lock .lock_unlocked").off();
                $(".rrules_edit_lock .lock_unlocked").on("click", function() {rrules_rule_lock_unlock(rule_id, "unlock");});
            });
        } else {
            $("#edit_rule_modal .modal-title").text("Add New Rule");
            $(".rrules_edit_rule_name_row input").removeAttr("data-rule-id");
            $(".rrules_edit_rule_value_row select").empty();
            $(".rrules_edit_rule_value_row input").val("");

                $(".rrules_edit_lock").removeClass("rule_locked").addClass("rule_unlocked").hide();;
                $("#edit_rule_modal input, #edit_rule_modal select, #edit_rule_modal .btn_submit").removeAttr("disabled");

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
    $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllRuleTypes", function(type) {
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
    $.getJSON("https://tbc.etracinc.com:248/ais/getrulecomparison?TypeID=" + type_id, function(criteria) {
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
    $.getJSON("https://tbc.etracinc.com:248/ais/getrulevalues?TypeID=" + type_id, function(result) {
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
        rrules_show_loading(3, 1);
        var type_id = $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_type']").val();

        $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_criteria']").empty();
        $(".rrules_edit_rule_value_row select[name = 'rrules_edit_rule_value']").empty();
        rrules_load_rule_criteria(type_id, 0);
        rrules_load_rule_value(type_id, 0, "");
        rrules_close_loading();
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
             $.getJSON("https://tbc.etracinc.com:248/ais/updaterule?RuleID=" + rule_id + "&Name=" + new_rule_name + "&TypeID=" + new_type_id + "&ComparisonID=" + new_comparison_id + "&ConditionID=" + new_condition_id + "&CustomCondition=" + new_condition, function(data) { });
             $(".rrules_rule_item[data-rule-id=" + rule_id + "]").attr({"data-rule-name": new_rule_name, "data-rule-desc": new_rule_desc}).find(".rrules_rule_name").text(new_rule_name);
             toastr_msg = 'Rule Detail Successfully Edited.';
        } else {
            rrules_show_loading(2, 1);
            // Add New Rule
            $.getJSON("https://tbc.etracinc.com:248/ais/createNewRule", function(data) {
                var new_id = data.NewIndex;
                $.getJSON("https://tbc.etracinc.com:248/ais/updaterule?RuleID=" + new_id + "&Name=" + new_rule_name + "&TypeID=" + new_type_id + "&ComparisonID=" + new_comparison_id + "&ConditionID=" + new_condition_id + "&CustomCondition=" + new_condition, function(data) { });

                $("#rrules_rule_sample").clone().attr({ "id": "rrules_rule_id_" + new_id, "data-rule-id": new_id, "data-rule-name": new_rule_name, "data-rule-desc": new_rule_desc }).addClass("rrules_type_definition new").removeClass("hidden").insertBefore(".add_new_rule");
                $("#rrules_rule_id_" + new_id + " .rrules_rule_name").text(new_rule_name);
                rrules_load_rules_events();
                rrules_close_loading();
                toastr_msg = 'New Rule Added Successfully.';
            });
        }

        $('#edit_rule_modal').modal('hide');
        toastr.success(toastr_msg, 'Success Alert', {});
        rrules_close_loading();
    });
}

// Drop Rules to used rule area
function rrules_drop_to_used() {
    $(".rrules_rules_used .rrules_rules_box").droppable({
        accept: ".rrules_type_definition",
        drop: function(event, ui) {
            if($(ui.helper).hasClass("add_new_rule") === false) {
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
                $.getJSON("https://tbc.etracinc.com:248/AIS/AddNewRuleToRuleGroup?GroupID=" + group_id + "&RuleID=" + rule_id + "&Order=2", function(result) {
                });
                toastr_msg = 'Rule Successfully Added To Group.';
                toastr.success(toastr_msg, 'Success Alert', {});
            }
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
    $.getJSON("https://tbc.etracinc.com:248/AIS/RemoveRuleFromRuleGroup?GroupID=" + group_id + "&RuleID=" + id, function(result) {
    });
    toastr_msg = 'Rule Removed From Group.';
    toastr.success(toastr_msg, 'Success Alert', {});
}

// Toggle group
function rrules_group_info_toggle() {
    $(".rrules_group_info").hide();
    $(".rrules_group_edit").show();
}

// Load email functions
function rrules_email_functions() {
    // Load the email alerts
    rrules_load_emails();

    // Drop email to used area
    rrules_drop_email_to_used();

    // Drop email to definition area
    rrules_drop_email_to_definition();

    // Submit add email
    rrules_add_email_submit();
}

// Load email alerts
function rrules_load_emails() {
    // Get email alert details from the URL link
    $.getJSON("https://tbc.etracinc.com:248/AIS/GetAllEmails", function(emails) {
        $.each(emails, function(key, value) {
            // Load Rule definitions, Clone each Rule item and apply Id and Name to that item
            $("#rrules_email_sample").clone().attr({ "id": "rrules_email_id_" + value.ID, "data-email-id": value.ID, "data-email-name": value.Email}).addClass("new rrules_email_type_definition").removeClass("hidden").appendTo(".rrules_email_definition .rrules_email_box");
            $("#rrules_email_id_" + value.ID + " .rrules_email_name").text(value.Email);
        });

        // Add new email button
        rrules_add_email_button();

        rrules_load_email_events();
    });
}

// Load used emails
function rrules_load_used_emails(used_emails) {
    $.each(used_emails, function(key, id) {
        var email_name = $("#rrules_email_id_" + id).attr("data-email-name");
        $("#rrules_email_sample").clone().attr({ "id": "rrules_used_email_id_" + id, "data-email-id": id, "data-email-name": email_name }).addClass("new rrules_email_type_used").removeClass("hidden").appendTo(".rrules_email_used .rrules_email_box");
        $("#rrules_used_email_id_" + id + " .rrules_email_name").text(email_name);

        // Hide used email in definition
        rrules_hide_used_email(id);
    });

    // Close loading overlay
    rrules_close_loading();
}

// Hide used email in definition
function rrules_hide_used_email(email_id) {

    $("#rrules_email_id_" + email_id).removeClass("rrules_email_definition ui-draggable ui-draggable-handle").addClass("rrules_email_definition_used hidden");
}

// Add New Email Button
function rrules_add_email_button() {
    $("#rrules_email_sample").clone().addClass("add_new_email").removeClass("hidden").empty().appendTo(".rrules_email_box.sortable4");
    $(".add_new_email").append('<i class="fa fa-plus-circle" aria-hidden="true"></i>').off();
    $(".add_new_email").on("click", function() {$('#add_email_modal').modal('show');});

    $('#add_email_modal').on('show.bs.modal', function() {
        $("#add_email_modal input").val("");
     });
}

// Load Email events
function rrules_load_email_events() {
    // Clear existing events
    $(".rrules_email_item.new").off();
    $(".rrules_email_item.new .rrules_email_delete").off();

    // Delete Email from used Email
    $(".rrules_email_used .rrules_email_item.new .rrules_email_delete").on("click", function(event) {
        if($(".rrules_rules_area").hasClass("locked") === false) {
            // Stop Rule selection
            event.stopPropagation();

            var element = $(this).closest(".rrules_email_item");
            rrules_remove_used_email(element);
        }
    });

    // Delete email from email definition
    $(".rrules_email_definition .rrules_email_item.new .rrules_email_delete").on("click", function(event) {
        if($(".rrules_rules_area").hasClass("locked") === false) {
            // Stop Rule selection
            event.stopPropagation();

            var element = $(this).closest(".rrules_email_item");
            var email_id = element.attr("data-email-id");

            $("#dialog_modal").modal();
            $("#dialog_modal .modal-body").text("Are you sure you want to delete this Email Alert?");

            $("#dialog_modal .btn_yes").off();
            $("#dialog_modal .btn_yes").on("click", function() {
                rrules_show_loading(0,1);
                // Delete Email
                $.getJSON("https://tbc.etracinc.com:248/AIS/RemoveEmail?EmailID=" + email_id).always(function(data) {
                    $('#dialog_modal').modal('hide');
                    if(data.responseText === "Ok") {
                        element.remove();
                        toastr.success('Email Successfully Deleted.', 'Success Alert', {});
                    }
                    rrules_close_loading();
                });
            });
        }
    });

    // Remove class .new from New items
    $(".rrules_email_item.new").removeClass("new");
}

// Drop email to used area
function rrules_drop_email_to_used() {
    $(".rrules_email_used .rrules_email_box").droppable({
        accept: ".rrules_email_type_definition",
        drop: function(event, ui) {
            if($(ui.helper).hasClass("add_new_email") === false) {
                var email_id = $(ui.helper).attr("id").replace("rrules_email_id_", "");
                $(ui.helper).clone().attr("id", "rrules_used_email_id_" + email_id).addClass("new rrules_email_type_used").removeClass("rrules_email_type_definition ui-draggable ui-draggable-handle ui-draggable-dragging").removeAttr("style").appendTo($(this));
                $(ui.helper).remove();

                // Hide used email in definition
                rrules_hide_used_email(email_id);

                // Load Rule events
                rrules_load_email_events();

                var group_id = $(".rrules_group_label").attr("data-id");
                // URL to Insert Rule to Group
                $.getJSON("https://tbc.etracinc.com:248/AIS/AddNewEmailToRuleGroup?GroupID=" + group_id + "&emailID=" + email_id, function(result) {
                });
                toastr_msg = 'Email Alert Successfully Added To Group.';
                toastr.success(toastr_msg, 'Success Alert', {});
            }
        }
    });
}

// Drop email  to definition
function rrules_drop_email_to_definition() {
    $(".rrules_email_definition .rrules_email_box").droppable({
        accept: ".rrules_email_type_used",
        drop: function(event, ui) {
            var element = $("#" + ui.draggable.attr("id"));
            ui.helper.remove();
            rrules_remove_used_email(element);
        }
    });
}

// Remove used email
function rrules_remove_used_email(element) {
    var id = element.attr("id").replace("rrules_used_email_id_", "");
    $("#rrules_email_id_" + id).addClass("new rrules_email_type_definition").removeClass("rrules_email_type_used hidden");
    $("#rrules_email_id_" + id + " .rrules_used_hint").text("");

    // Delete used email
    element.remove();

    var group_id = $(".rrules_group_label").attr("data-id");
    // URL to Delete email from Group
    $.getJSON("https://tbc.etracinc.com:248/AIS/RemoveEmailFromRuleGroup?GroupID=" + group_id + "&emailID=" + id, function(result) {
    });
    toastr_msg = 'Email Alert Removed From Group.';
    toastr.success(toastr_msg, 'Success Alert', {});
}

// Submit add email button
function rrules_add_email_submit() {
    $("#add_email_modal .btn_submit").off();
    $("#add_email_modal .btn_submit").on("click", function() {
        var toastr_msg;
        var new_email = $("#add_email_modal input.email_id").val();

        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if(new_email.match(mailformat)) {
            rrules_show_loading(0, 1);
            // Add New Rule
            $.getJSON("https://tbc.etracinc.com:248/AIS/CreateNewEmail?Email=" + new_email, function(data) {});

            $('#add_email_modal').modal('hide');
            toastr_msg = 'New Email Alert Added Successfully.';
            toastr.success(toastr_msg, 'Success Alert', {});
            var current_group_id = $(".rrules_group_label").attr("data-id");
            rrules_reload_group(current_group_id);
            rrules_close_loading();
        } else {
            toastr_msg = 'Invalid Email';
            toastr.error(toastr_msg, 'Error Alert', {});
        }
    });
}

// Initiate the draggable elements
function rrules_init_sortable() {
    $(".sortable1, .sortable2").sortable({
        revert: true,
        connectWith: ".sortable_rules",
        cancel: ".add_new_rule",
        helper: "clone",
        stop: function() {
            $(".sortable2").sortable( "cancel" );
        }
    });

    $(".sortable3, .sortable4").sortable({
        revert: true,
        connectWith: ".sortable_emails",
        cancel: ".add_new_email",
        helper: "clone",
        stop: function() {
            $(".sortable4").sortable( "cancel" );
        }
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

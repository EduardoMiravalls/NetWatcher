<?php
/**
 * View class of the settings
 *
 * Inherits from appView class
 *
 * @package App
 */

/**
 * App namespace (user defined behaviour)
 */
namespace App;

/**
 * settingsView class.
 * Renders the visual representation of the settings
 */
class settingsView extends Common\appView
{

    /**
     * Constructor for the settingsView class.
     * Sets the page title
     *
     * @param SettingsModel $model
     *            Data model of the Settings page
     */
    public function __construct(SettingsModel $model)
    {
        parent::__construct($model);
        $this->title = _('Settings');
    }

    /**
     * Renders the main content of the page inside the rest of the page
     *
     * @see \App\Common\Views\appView::renderContent()
     */
    protected function renderContent()
    {
        /* Form for settings */
        $this->pLine('<form class="form-horizontal" role="form" action="settings/save" method="post">');
        
        /* Server settings */
        $this->pLine('<div class="row">', 1);
        $this->pLine('<div class="col-md-4">', 1);
        $this->pLine('<h3 class="pull-right">' . _('Server Settings') . '</h3>', 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('<div class="row">');
        $this->pLine('<div class="col-md-8 col-md-offset-2">', 1);
        $this->pLine('<hr>', 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('<div class="form-group has-feedback" id="serverIpForm">');
        $this->pLine('<label for="serverIp" class="col-sm-4 control-label">' . _('FPGA API base address') . '</label>', 1);
        $this->pLine('<div class="col-sm-6">');
        $this->pLine('<input type="text" class="form-control" name="serverIp" id="serverIp" value="' . \Core\Router::sanitize(\Core\Config::$REMOTE_SERVER_IP) . '">', 1);
        $this->pLine('<span class="glyphicon form-control-feedback" id="ipIcon" aria-hidden="true"></span>');
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        
        /* App settings */
        /* Language */
        $this->pLine('<div class="row">');
        $this->pLine('<div class="col-md-4">', 1);
        $this->pLine('<h3 class="pull-right">' . _('App Settings') . '</h3>', 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('<div class="row">');
        $this->pLine('<div class="col-md-8 col-md-offset-2">', 1);
        $this->pLine('<hr>', 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('<div class="form-group">');
        $this->pLine('<label for="language" class="col-sm-4 control-label">' . _('Language') . '</label>', 1);
        $this->pLine('<div class="col-sm-6">');
        $this->pLine('<select class="form-control custom" name="language" id="language">', 1);
        $this->moveIndent(1);
        foreach (\Core\Config::$LANGUAGES as $text => $lang) {
            if ($text == \Core\Config::$DEFAULT_LANG) {
                $this->pLine('<option value="' . $text . '" selected>' . $text . '</option>');
            } else {
                $this->pLine('<option value="' . $text . '">' . $text . '</option>');
            }
        }
        $this->pLine('</select>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        /* Theme */
        $this->pLine('<div class="form-group">');
        $this->pLine('<label for="theme" class="col-sm-4 control-label">' . _('Theme') . '</label>', 1);
        $this->pLine('<div class="col-sm-6">');
        $this->pLine('<select class="form-control custom" name="theme" id="theme">', 1);
        $this->moveIndent(1);
        foreach (\Core\Config::$CSS_THEMES as $text => $theme) {
            if ($text == \Core\Config::$DEFAULT_CSS_THEME) {
                $this->pLine('<option value="' . $text . '" selected>' . $text . '</option>');
            } else {
                $this->pLine('<option value="' . $text . '">' . $text . '</option>');
            }
        }
        $this->pLine('</select>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        
        /* Save button */
        $this->pLine('<div class="form-group">');
        $this->pLine('<div class="col-sm-offset-8 col-sm-2">', 1);
        $this->pLine('<button type="submit" class="btn btn-primary pull-right">' . _('Save') . '</button>', 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</div>', - 1);
        $this->pLine('</form>', - 1);
    }
}
?>
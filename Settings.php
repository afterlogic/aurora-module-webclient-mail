<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailWebclient;

use Aurora\System\SettingsProperty;

/**
 * @property bool $Disabled
 * @property bool $AllowAppRegisterMailto
 * @property bool $AllowChangeInputDirection
 * @property bool $FoldersExpandedByDefault
 * @property bool $AllowSpamFolder
 * @property bool $AllowAddNewFolderOnMainScreen
 * @property array $ComposeToolbarOrder,
 * @property string $DefaultFontName
 * @property int $DefaultFontSize
 * @property bool $AlwaysTryUseImageWhilePasting
 * @property bool $AllowHorizontalLineButton
 * @property bool $AllowComposePlainText
 * @property bool $AllowEditHtmlSource
 * @property array $TextEditorImageResizerOptions,
 * @property bool $JoinReplyPrefixes
 * @property int $MailsPerPage
 * @property bool $AllowChangeStarredMessagesSource
 * @property int $MaxMessagesBodiesSizeToPrefetch
 * @property int $MessageBodyTruncationThreshold
 * @property bool $ShowEmailAsTabName
 * @property bool $AllowOtherModulesToReplaceTabsbarHeader
 * @property bool $AllowShowMessagesCountInFolderList
 * @property bool $AllowSearchMessagesBySubject
 * @property array $PrefixesToRemoveBeforeSearchMessagesBySubject,
 * @property bool $AllowHorizontalLayout
 * @property bool $HorizontalLayoutByDefault
 * @property bool $DisableRtlRendering
 * @property bool $AllowQuickReply
 * @property bool $AllowQuickSendOnCompose
 * @property bool $AllowUserGroupsInComposeAutocomplete
 * @property bool $MarkMessageSeenWhenViewing
 * @property bool $MarkMessageSeenWhenAnswerForward
 * @property bool $UserLoginPartInAccountDropdown
 * @property bool $UseMeRecipientForMessages
 */

class Settings extends \Aurora\System\Module\Settings
{
    protected function initDefaults()
    {
        $this->aContainer = [
            "Disabled" => new SettingsProperty(
                false,
                "bool",
                null,
                "Setting to true disables the module",
            ),
            "AllowAppRegisterMailto" => new SettingsProperty(
                true,
                "bool",
                null,
                "Enables setting the product installation as mailto: links handler",
            ),
            "AllowChangeInputDirection" => new SettingsProperty(
                false,
                "bool",
                null,
                "Enables switching between RTL and LTR input directions",
            ),
            "FoldersExpandedByDefault" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, email folders hierarchy is displayed fully expanded by default, collapsed otherwise",
            ),
            "AllowSpamFolder" => new SettingsProperty(
                true,
                "bool",
                null,
                "Enables the use of Spam folder and moving messages from/to Spam with a button",
            ),
            "AllowAddNewFolderOnMainScreen" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, New Folder button is added on mail screen",
            ),
            "ComposeToolbarOrder" => new SettingsProperty(
                [
                    "back",
                    "send",
                    "save",
                    "importance",
                    "MailSensitivity",
                    "confirmation",
                    "OpenPgp"
                ],
                "array",
                null,
                "Defines list of controls shown on compose toolbar in their order from left to right",
            ),
            "DefaultFontName" => new SettingsProperty(
                "Tahoma",
                "string",
                null,
                "Font name used by default when composing email message",
            ),
            "DefaultFontSize" => new SettingsProperty(
                3,
                "int",
                null,
                "Font size used by default when composing email message",
            ),
            "AlwaysTryUseImageWhilePasting" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, complex content like tables will be pasted as image by default",
            ),
            "AllowHorizontalLineButton" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, Insert Horizontal Line button is added to compose toolbar",
            ),
            "AllowComposePlainText" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, Plain Text switcher is added to compose HTML editor",
            ),
            "AllowEditHtmlSource" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, HTML source code editing is added to HTML editor",
            ),
            "TextEditorImageResizerOptions" => new SettingsProperty(
                [
                    "MAILWEBCLIENT/ACTION_MAKE_IMAGE_SMALL" => "300px",
                    "MAILWEBCLIENT/ACTION_MAKE_IMAGE_MEDIUM" => "600px",
                    "MAILWEBCLIENT/ACTION_MAKE_IMAGE_LARGE" => "1200px",
                    "MAILWEBCLIENT/ACTION_MAKE_IMAGE_ORIGINAL" => ""
                ],
                "array",
                null,
                "The list of image size options that can be set for an image in the editor. It's possible to set sizes in pixels and percentages.",
            ),
            "JoinReplyPrefixes" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, multiple prefixes such as Re: or Fwd: will be merged as much as possible when composing a new reply/forward",
            ),
            "MailsPerPage" => new SettingsProperty(
                20,
                "int",
                null,
                "Default number of mail messages displayed per page",
            ),
            "AllowChangeStarredMessagesSource" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, starred messages source can be changed. Two possible sources: inbox only and all folders",
            ),
            "MaxMessagesBodiesSizeToPrefetch" => new SettingsProperty(
                50000,
                "int",
                null,
                "Sets a limit of message bodies to be prefetched, in bytes",
            ),
            "MessageBodyTruncationThreshold" => new SettingsProperty(
                650000,
                "int",
                null,
                "Sets a limit for message body size to be fetched",
            ),
            "ShowEmailAsTabName" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, email address will be shown instead of Mail screen tab name",
            ),
            "AllowOtherModulesToReplaceTabsbarHeader" => new SettingsProperty(
                false,
                "bool",
                null,
                "If set to true, other modules can supply custom HeaderItemView template instead of default one of this module",
            ),
            "AllowShowMessagesCountInFolderList" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, number of messages will be displayed for all folders in the list",
            ),
            "AllowSearchMessagesBySubject" => new SettingsProperty(
                true,
                "bool",
                null,
                "Enables the feature of searching for text selection in Subject area of preview pane",
            ),
            "PrefixesToRemoveBeforeSearchMessagesBySubject" => new SettingsProperty(
                [
                    "Re",
                    "Fwd"
                ],
                "array",
                null,
                "",
            ),
            "AllowHorizontalLayout" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, users are able to switch betwee vertical and horizontal layouts of mail screen",
            ),
            "HorizontalLayoutByDefault" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, horizontal layout is used on mail screen by default",
            ),
            "DisableRtlRendering" => new SettingsProperty(
                false,
                "bool",
                null,
                "If set to true, messages are always displayed in left-to-right view, regarldess of their content",
            ),
            "AllowQuickReply" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, a quick reply pane is available under message preview",
            ),
            "AllowQuickSendOnCompose" => new SettingsProperty(
                false,
                "bool",
                null,
                "Enables Ctrl-Enter shortcut for sending mail out",
            ),
            "AllowUserGroupsInComposeAutocomplete" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, user groups become available in address autocompletion when composing a message",
            ),
            "MarkMessageSeenWhenViewing" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, message automatically becomes read when viewed by selecting it in message list",
            ),
            "MarkMessageSeenWhenAnswerForward" => new SettingsProperty(
                false,
                "bool",
                null,
                "If true, message becomes read when forwarded or replied to",
            ),
            "UserLoginPartInAccountDropdown" => new SettingsProperty(
                false,
                "bool",
                null,
                "If set to true, only username is displayed in account dropdown, instead of full email address",
            ),
            "UseMeRecipientForMessages" => new SettingsProperty(
                true,
                "bool",
                null,
                "If true, 'me' will be displayed instead of user's email address in headers section of message preview pane (collapsed view only)",
            ),
        ];
    }
}

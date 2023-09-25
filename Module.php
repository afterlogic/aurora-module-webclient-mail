<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailWebclient;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2023, Afterlogic Corp.
 *
 * @property Settings $oModuleSettings
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
    /**
     * Initializes CoreWebclient Module.
     *
     * @ignore
     */
    public function init()
    {
        $this->subscribeEvent('Mail::UpdateSettings::after', array($this, 'onAfterUpdateSettings'));
    }

    /**
     * @return Module
     */
    public static function getInstance()
    {
        return parent::getInstance();
    }

    /**
     * @return Module
     */
    public static function Decorator()
    {
        return parent::Decorator();
    }

    /**
     * @return Settings
     */
    public function getModuleSettings()
    {
        return $this->oModuleSettings;
    }

    public function GetSettings()
    {
        \Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

        $aSettings = array(
            'AllowAppRegisterMailto' => $this->oModuleSettings->AllowAppRegisterMailto,
            'AllowChangeInputDirection' => $this->oModuleSettings->AllowChangeInputDirection,
            'FoldersExpandedByDefault' => $this->oModuleSettings->FoldersExpandedByDefault,
            'AllowSpamFolder' => $this->oModuleSettings->AllowSpamFolder,
            'AllowAddNewFolderOnMainScreen' => $this->oModuleSettings->AllowAddNewFolderOnMainScreen,
            'ComposeToolbarOrder' => $this->oModuleSettings->ComposeToolbarOrder,
            'DefaultFontName' => $this->oModuleSettings->DefaultFontName,
            'DefaultFontSize' => $this->oModuleSettings->DefaultFontSize,
            'AlwaysTryUseImageWhilePasting' => $this->oModuleSettings->AlwaysTryUseImageWhilePasting,
            'AllowHorizontalLineButton' => $this->oModuleSettings->AllowHorizontalLineButton,
            'AllowComposePlainText' => $this->oModuleSettings->AllowComposePlainText,
            'AllowEditHtmlSource' => $this->oModuleSettings->AllowEditHtmlSource,
            'JoinReplyPrefixes' => $this->oModuleSettings->JoinReplyPrefixes,
            'MailsPerPage' => $this->oModuleSettings->MailsPerPage,
            'AllowChangeStarredMessagesSource' => $this->oModuleSettings->AllowChangeStarredMessagesSource,
            'MaxMessagesBodiesSizeToPrefetch' => $this->oModuleSettings->MaxMessagesBodiesSizeToPrefetch,
            'MessageBodyTruncationThreshold' => $this->oModuleSettings->MessageBodyTruncationThreshold, // in bytes
            'ShowEmailAsTabName' => $this->oModuleSettings->ShowEmailAsTabName,
            'AllowOtherModulesToReplaceTabsbarHeader' => $this->oModuleSettings->AllowOtherModulesToReplaceTabsbarHeader,
            'AllowShowMessagesCountInFolderList' => $this->oModuleSettings->AllowShowMessagesCountInFolderList,
            'AllowSearchMessagesBySubject' => $this->oModuleSettings->AllowSearchMessagesBySubject,
            'PrefixesToRemoveBeforeSearchMessagesBySubject' => $this->oModuleSettings->PrefixesToRemoveBeforeSearchMessagesBySubject,
            'AllowHorizontalLayout' => $this->oModuleSettings->AllowHorizontalLayout,
            'HorizontalLayoutByDefault' => $this->oModuleSettings->HorizontalLayoutByDefault,
            'DisableRtlRendering' => $this->oModuleSettings->DisableRtlRendering,
            'AllowQuickReply' => $this->oModuleSettings->AllowQuickReply,
            'AllowQuickSendOnCompose' => $this->oModuleSettings->AllowQuickSendOnCompose,
            'AllowUserGroupsInComposeAutocomplete' => $this->oModuleSettings->AllowUserGroupsInComposeAutocomplete,
            'MarkMessageSeenWhenViewing' => $this->oModuleSettings->MarkMessageSeenWhenViewing,
            'MarkMessageSeenWhenAnswerForward' => $this->oModuleSettings->MarkMessageSeenWhenAnswerForward,
            'UserLoginPartInAccountDropdown' => $this->oModuleSettings->UserLoginPartInAccountDropdown,
            'UseMeRecipientForMessages' => $this->oModuleSettings->UseMeRecipientForMessages,
            'HorizontalLayout' => $this->oModuleSettings->HorizontalLayoutByDefault,
            'ShowMessagesCountInFolderList' => $this->oModuleSettings->AllowShowMessagesCountInFolderList,
            'TextEditorImageResizerOptions' => $this->oModuleSettings->TextEditorImageResizerOptions,
        );

        $oUser = \Aurora\System\Api::getAuthenticatedUser();
        if ($oUser && $oUser->isNormalOrTenant()) {
            if (null !== $oUser->getExtendedProp(self::GetName() . '::AllowChangeInputDirection')) {
                $aSettings['AllowChangeInputDirection'] = $oUser->getExtendedProp(self::GetName() . '::AllowChangeInputDirection');
            }
            if (null !== $oUser->getExtendedProp(self::GetName() . '::MailsPerPage')) {
                $aSettings['MailsPerPage'] = $oUser->getExtendedProp(self::GetName() . '::MailsPerPage');
            }
            if (null !== $oUser->getExtendedProp(self::GetName() . '::StarredMessagesSource')) {
                $aSettings['StarredMessagesSource'] = $oUser->getExtendedProp(self::GetName() . '::StarredMessagesSource');
            }
            if (null !== $oUser->getExtendedProp(self::GetName() . '::ShowMessagesCountInFolderList')) {
                $aSettings['ShowMessagesCountInFolderList'] = $oUser->getExtendedProp(self::GetName() . '::ShowMessagesCountInFolderList');
            }
            if ($this->oModuleSettings->AllowHorizontalLayout && null !== $oUser->getExtendedProp(self::GetName() . '::HorizontalLayout')) {
                $aSettings['HorizontalLayout'] = $oUser->getExtendedProp(self::GetName() . '::HorizontalLayout');
            }
        }

        return $aSettings;
    }

    public function onAfterUpdateSettings($Args, &$Result)
    {
        \Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

        $oUser = \Aurora\System\Api::getAuthenticatedUser();
        if ($oUser) {
            if ($oUser->isNormalOrTenant()) {
                $oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
                if (isset($Args['MailsPerPage'])) {
                    $oUser->setExtendedProp(self::GetName() . '::MailsPerPage', $Args['MailsPerPage']);
                }
                if (isset($Args['StarredMessagesSource'])) {
                    $oUser->setExtendedProp(self::GetName() . '::StarredMessagesSource', $Args['StarredMessagesSource']);
                }
                if (isset($Args['AllowChangeInputDirection'])) {
                    $oUser->setExtendedProp(self::GetName() . '::AllowChangeInputDirection', $Args['AllowChangeInputDirection']);
                }
                if (isset($Args['ShowMessagesCountInFolderList'])) {
                    $oUser->setExtendedProp(self::GetName() . '::ShowMessagesCountInFolderList', $Args['ShowMessagesCountInFolderList']);
                }
                if ($this->oModuleSettings->AllowHorizontalLayout && isset($Args['HorizontalLayout'])) {
                    $oUser->setExtendedProp(self::GetName() . '::HorizontalLayout', $Args['HorizontalLayout']);
                }
                return $oCoreDecorator->UpdateUserObject($oUser);
            }
            if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin) {
                if (isset($Args['MailsPerPage'])) {
                    $this->setConfig('MailsPerPage', $Args['MailsPerPage']);
                }
                if (isset($Args['AllowChangeInputDirection'])) {
                    $this->setConfig('AllowChangeInputDirection', $Args['AllowChangeInputDirection']);
                }
                if ($this->oModuleSettings->AllowHorizontalLayout && isset($Args['HorizontalLayoutByDefault'])) {
                    $this->setConfig('HorizontalLayoutByDefault', $Args['HorizontalLayoutByDefault']);
                }
                return $this->saveModuleConfig();
            }
        }
    }
}

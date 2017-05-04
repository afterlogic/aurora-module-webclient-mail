<?php
/**
 * @copyright Copyright (c) 2017, Afterlogic Corp.
 * @license AGPL-3.0 or AfterLogic Software License
 *
 * This code is licensed under AGPLv3 license or AfterLogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailWebclient;

/**
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	/**
	 * Initializes CoreWebclient Module.
	 * 
	 * @ignore
	 */
	public function init() {
		$this->extendObject('CUser', array(
				'AllowChangeInputDirection'	=> array('bool', false),
				'MailsPerPage'				=> array('int', 20),
				'SaveRepliesToCurrFolder'	=> array('bool', false),
			)
		);
		
		$this->subscribeEvent('Mail::UpdateSettings::after', array($this, 'onAfterUpdateSettings'));
	}
	
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\EUserRole::Anonymous);
		
		$aSettings = array(
			'AllowAppRegisterMailto' => $this->getConfig('AllowAppRegisterMailto', false),
			'AllowChangeInputDirection' => $this->getConfig('AllowChangeInputDirection', false),
			'AllowExpandFolders' => $this->getConfig('AllowExpandFolders', false),
			'AllowSpamFolder' => $this->getConfig('AllowSpamFolder', true),
			'ComposeToolbarOrder' => $this->getConfig('ComposeToolbarOrder', array()),
			'DefaultFontName' => $this->getConfig('DefaultFontName', 'Tahoma'),
			'DefaultFontSize' => $this->getConfig('DefaultFontSize', 3),
			'JoinReplyPrefixes' => $this->getConfig('JoinReplyPrefixes', false),
			'MailsPerPage' => $this->getConfig('MailsPerPage', 20),
			'MaxMessagesBodiesSizeToPrefetch' => $this->getConfig('MaxMessagesBodiesSizeToPrefetch', 50000),
			'SaveRepliesToCurrFolder' => $this->getConfig('SaveRepliesToCurrFolder', false),
		);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser && $oUser->Role === \EUserRole::NormalUser)
		{
			if (isset($oUser->{$this->GetName().'::AllowChangeInputDirection'}))
			{
				$aSettings['AllowChangeInputDirection'] = $oUser->{$this->GetName().'::AllowChangeInputDirection'};
			}
			if (isset($oUser->{$this->GetName().'::MailsPerPage'}))
			{
				$aSettings['MailsPerPage'] = $oUser->{$this->GetName().'::MailsPerPage'};
			}
			if (isset($oUser->{$this->GetName().'::SaveRepliesToCurrFolder'}))
			{
				$aSettings['SaveRepliesToCurrFolder'] = $oUser->{$this->GetName().'::SaveRepliesToCurrFolder'};
			}
		}
		
		return $aSettings;
	}
	
	public function onAfterUpdateSettings($Args, &$Result)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\EUserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser)
		{
			if ($oUser->Role === \EUserRole::NormalUser)
			{
				$oCoreDecorator = \Aurora\System\Api::GetModuleDecorator('Core');
				if (isset($Args['MailsPerPage']))
				{
					$oUser->{$this->GetName().'::MailsPerPage'} = $Args['MailsPerPage'];
				}
				if (isset($Args['SaveRepliesToCurrFolder']))
				{
					$oUser->{$this->GetName().'::SaveRepliesToCurrFolder'} = $Args['SaveRepliesToCurrFolder'];
				}
				if (isset($Args['AllowChangeInputDirection']))
				{
					$oUser->{$this->GetName().'::AllowChangeInputDirection'} = $Args['AllowChangeInputDirection'];
				}
				return $oCoreDecorator->UpdateUserObject($oUser);
			}
			if ($oUser->Role === \EUserRole::SuperAdmin)
			{
				if (isset($Args['MailsPerPage']))
				{
					$this->setConfig('MailsPerPage', $Args['MailsPerPage']);
				}
				if (isset($Args['SaveRepliesToCurrFolder']))
				{
					$this->setConfig('SaveRepliesToCurrFolder', $Args['SaveRepliesToCurrFolder']);
				}
				if (isset($Args['AllowChangeInputDirection']))
				{
					$this->setConfig('AllowChangeInputDirection', $Args['AllowChangeInputDirection']);
				}
				return $this->saveModuleConfig();
			}
		}
	}
}

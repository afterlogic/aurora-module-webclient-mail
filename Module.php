<?php
/**
 * This code is licensed under AGPLv3 license or AfterLogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailWebclient;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing AfterLogic Software License
 * @copyright Copyright (c) 2018, Afterlogic Corp.
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
		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'AllowChangeInputDirection'	=> array('bool', $this->getConfig('AllowChangeInputDirection', false)),
				'MailsPerPage'				=> array('int', $this->getConfig('MailsPerPage', 20)),
			]
		);		
		
		$this->subscribeEvent('Mail::UpdateSettings::after', array($this, 'onAfterUpdateSettings'));
	}
	
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		$aSettings = array(
			'AllowAppRegisterMailto' => $this->getConfig('AllowAppRegisterMailto', false),
			'AllowChangeInputDirection' => $this->getConfig('AllowChangeInputDirection', false),
			'AllowExpandFolders' => $this->getConfig('AllowExpandFolders', false),
			'AllowSpamFolder' => $this->getConfig('AllowSpamFolder', true),
			'AllowAddNewFolderOnMainScreen' => $this->getConfig('AllowAddNewFolderOnMainScreen', false),
			'ComposeToolbarOrder' => $this->getConfig('ComposeToolbarOrder', array()),
			'DefaultFontName' => $this->getConfig('DefaultFontName', 'Tahoma'),
			'DefaultFontSize' => $this->getConfig('DefaultFontSize', 3),
			'JoinReplyPrefixes' => $this->getConfig('JoinReplyPrefixes', false),
			'MailsPerPage' => $this->getConfig('MailsPerPage', 20),
			'MaxMessagesBodiesSizeToPrefetch' => $this->getConfig('MaxMessagesBodiesSizeToPrefetch', 50000),
			'ShowEmailAsTabName' => $this->getConfig('ShowEmailAsTabName', true)
		);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser && $oUser->Role === \Aurora\System\Enums\UserRole::NormalUser)
		{
			if (isset($oUser->{self::GetName().'::AllowChangeInputDirection'}))
			{
				$aSettings['AllowChangeInputDirection'] = $oUser->{self::GetName().'::AllowChangeInputDirection'};
			}
			if (isset($oUser->{self::GetName().'::MailsPerPage'}))
			{
				$aSettings['MailsPerPage'] = $oUser->{self::GetName().'::MailsPerPage'};
			}
		}
		
		return $aSettings;
	}
	
	public function onAfterUpdateSettings($Args, &$Result)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser)
		{
			if ($oUser->Role === \Aurora\System\Enums\UserRole::NormalUser)
			{
				$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
				if (isset($Args['MailsPerPage']))
				{
					$oUser->{self::GetName().'::MailsPerPage'} = $Args['MailsPerPage'];
				}
				if (isset($Args['AllowChangeInputDirection']))
				{
					$oUser->{self::GetName().'::AllowChangeInputDirection'} = $Args['AllowChangeInputDirection'];
				}
				return $oCoreDecorator->UpdateUserObject($oUser);
			}
			if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
			{
				if (isset($Args['MailsPerPage']))
				{
					$this->setConfig('MailsPerPage', $Args['MailsPerPage']);
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

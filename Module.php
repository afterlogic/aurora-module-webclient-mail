<?php
/**
 * @copyright Copyright (c) 2017, Afterlogic Corp.
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
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
